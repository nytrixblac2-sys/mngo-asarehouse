import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { parseICalFeed, extractReservationCode } from "@/lib/ical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily cron job (04:00 UTC) — triggered by Vercel Cron (vercel.json).
 * Originally hourly, but Vercel's Hobby plan only allows cron jobs to run
 * once per day — an hourly schedule silently failed deployment validation,
 * so every push after this feature was added never actually went live
 * (Vercel kept serving the last successful deployment with no error
 * surfaced anywhere this project could see it). Switched to daily,
 * 2026-09-08, to match the plan's limit; revisit if the workspace ever
 * moves to a paid Vercel plan and wants tighter sync latency.
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` so this
 * endpoint is not callable from the browser without that secret.
 *
 * For each Property that has an airbnbICalUrl set:
 * 1. Fetch the iCal feed from Airbnb
 * 2. Parse events — create MNGO bookings for new real reservations,
 *    unless an existing, not-yet-synced booking on the same property
 *    already covers those dates (a manager who checked Airbnb and typed
 *    a stay in by hand before the sync got to it, or before this
 *    dedup existed at all) — link that reservation's UID onto the real
 *    booking instead of creating a duplicate.
 * 3. Reconcile already-existing duplicates (self-healing — see below).
 * 4. Soft-delete bookings whose UID no longer appears (cancelled on Airbnb
 *    — Airbnb's feed has no cancelled-status marker, a cancelled
 *    reservation's VEVENT just disappears entirely) — only for future
 *    stays (past stays are kept as historical records)
 *
 * Amount is always 0 on creation; manager fills it in. Guest is a
 * placeholder ("Airbnb guest (<reservation code>)") since Airbnb's feed
 * never includes the guest's actual name (see lib/ical.ts) — the manager
 * renames it once they check Airbnb's own host dashboard. The dashboard
 * shows a "needs pricing" banner for bookings where icalUid IS NOT NULL
 * and amount = 0.
 *
 * Step 3 exists because the dedup in step 2 didn't always exist — the
 * very first sync run (before this fix, 2026-09-09/10) created plain
 * duplicates of stays Cecilia had already entered by hand from Airbnb
 * herself, with real guest names and real prices. Every cron run scans
 * for that same shape of duplicate (two active bookings on one property
 * with overlapping dates, one carrying an icalUid and one not) and
 * merges them the same way step 2 would have the first time — this is
 * a permanent, idempotent safety net, not a one-off migration, since the
 * same race (a manager enters a stay by hand the same day Airbnb's
 * reservation would otherwise have synced) can still happen going
 * forward. Overlap alone is enough to call two bookings "the same stay"
 * because a RENTAL property (the only kind this feature supports) is
 * one physical unit — it cannot genuinely host two overlapping stays at
 * once, unlike a HOSTEL property's per-room bookings.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const properties = await prisma.property.findMany({
    where: { airbnbICalUrl: { not: null } },
    select: { id: true, workspaceId: true, airbnbICalUrl: true, currencies: true },
  });

  let created = 0;
  let linked = 0;
  let reconciled = 0;
  let cancelled = 0;
  const errors: string[] = [];

  for (const property of properties) {
    try {
      const res = await fetch(property.airbnbICalUrl!, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        errors.push(`Property ${property.id}: HTTP ${res.status}`);
        continue;
      }

      const icsText = await res.text();
      const events = parseICalFeed(icsText);

      const reservationUids = new Set(
        events.filter((e) => e.isReservation).map((e) => e.uid)
      );

      // Default to first currency on the property (managers can edit later)
      const defaultCurrency = (property.currencies[0] ?? "GHS") as "GHS" | "EUR";

      // Create bookings for new reservations not already synced — unless
      // an existing, not-yet-synced booking already covers the same
      // dates on this property, in which case link this reservation's
      // UID onto it instead of creating a duplicate.
      for (const event of events) {
        if (!event.isReservation) continue; // Owner-blocked "Airbnb (...)" placeholder

        const exists = await prisma.booking.findUnique({ where: { icalUid: event.uid } });
        if (exists) continue;

        const overlapping = await prisma.booking.findMany({
          where: {
            propertyId: property.id,
            deletedAt: null,
            icalUid: null,
            checkIn: { lt: new Date(event.dtEnd) },
            checkOut: { gt: new Date(event.dtStart) },
          },
          select: { id: true },
        });

        if (overlapping.length === 1) {
          await prisma.booking.update({ where: { id: overlapping[0].id }, data: { icalUid: event.uid } });
          linked++;
          continue;
        }
        if (overlapping.length > 1) {
          errors.push(`Property ${property.id}: ${overlapping.length} existing bookings overlap Airbnb reservation ${event.uid} — skipped, needs manual review`);
          continue;
        }

        const code = extractReservationCode(event.description);
        const guest = code ? `Airbnb guest (${code})` : "Airbnb guest";

        await prisma.booking.create({
          data: {
            workspaceId: property.workspaceId,
            propertyId: property.id,
            guest,
            checkIn: new Date(event.dtStart),
            checkOut: new Date(event.dtEnd),
            amount: 0,
            currency: defaultCurrency,
            source: "AIRBNB",
            status: "EXPECTED",
            icalUid: event.uid,
          },
        });
        created++;
      }

      // Reconcile duplicates the dedup above didn't exist to prevent yet
      // (see this route's doc comment) — a synced booking and a manually
      // entered one on the same property with overlapping dates are the
      // same stay; keep the manual one (it has the real name and price)
      // and fold the icalUid onto it, then soft-delete the duplicate the
      // same way a cancellation would be. Nulling the duplicate's icalUid
      // before reassigning it is required — the column is unique.
      const syncedBookings = await prisma.booking.findMany({
        where: { propertyId: property.id, icalUid: { not: null }, deletedAt: null },
        select: { id: true, icalUid: true, guest: true, checkIn: true, checkOut: true },
      });
      for (const synced of syncedBookings) {
        const duplicateOf = await prisma.booking.findFirst({
          where: {
            propertyId: property.id,
            id: { not: synced.id },
            icalUid: null,
            deletedAt: null,
            checkIn: { lt: synced.checkOut },
            checkOut: { gt: synced.checkIn },
          },
          select: { id: true, guest: true },
        });
        if (!duplicateOf) continue;

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: synced.id },
            data: {
              icalUid: null,
              deletedAt: new Date(),
              deletedBy: "airbnb-sync",
              deleteReason: `Duplicate of manually-entered booking "${duplicateOf.guest}" for the same dates`,
            },
          }),
          prisma.booking.update({ where: { id: duplicateOf.id }, data: { icalUid: synced.icalUid } }),
        ]);
        reconciled++;
      }

      // Soft-delete future bookings whose UID disappeared from the feed
      // entirely — Airbnb doesn't mark a cancelled reservation, it just
      // removes the VEVENT, so "no longer present" is the only signal.
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureAirbnbBookings = await prisma.booking.findMany({
        where: {
          propertyId: property.id,
          icalUid: { not: null },
          deletedAt: null,
          checkOut: { gt: today },
        },
        select: { id: true, icalUid: true },
      });

      for (const booking of futureAirbnbBookings) {
        const uid = booking.icalUid!;
        if (!reservationUids.has(uid)) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              deletedAt: new Date(),
              deletedBy: "airbnb-sync",
              deleteReason: "Cancelled on Airbnb",
            },
          });
          cancelled++;
        }
      }
    } catch (err) {
      errors.push(`Property ${property.id}: ${(err as Error).message}`);
    }
  }

  return apiSuccess({ created, linked, reconciled, cancelled, errors });
}

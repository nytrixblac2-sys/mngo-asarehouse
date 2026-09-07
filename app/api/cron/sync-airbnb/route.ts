import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { parseICalFeed, extractGuestName } from "@/lib/ical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hourly cron job — triggered by Vercel Cron (vercel.json).
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` so this
 * endpoint is not callable from the browser without that secret.
 *
 * For each Property that has an airbnbICalUrl set:
 * 1. Fetch the iCal feed from Airbnb
 * 2. Parse events — create MNGO bookings for new confirmed guest reservations
 * 3. Soft-delete bookings whose UID no longer appears (cancelled on Airbnb)
 *    — only for future stays (past stays are kept as historical records)
 *
 * Amount is always 0 on creation; manager fills it in. The dashboard
 * shows a "needs pricing" banner for bookings where icalUid IS NOT NULL
 * and amount = 0.
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

      const confirmedUids = new Set(
        events.filter((e) => e.status === "CONFIRMED").map((e) => e.uid)
      );
      const cancelledUids = new Set(
        events.filter((e) => e.status === "CANCELLED").map((e) => e.uid)
      );

      // Default to first currency on the property (managers can edit later)
      const defaultCurrency = (property.currencies[0] ?? "GHS") as "GHS" | "EUR";

      // Create bookings for new confirmed events with a real guest name
      for (const event of events) {
        if (event.status !== "CONFIRMED") continue;

        const guestName = extractGuestName(event.summary);
        if (!guestName) continue; // Skip "Not available" owner-blocked slots

        const exists = await prisma.booking.findUnique({ where: { icalUid: event.uid } });
        if (exists) continue;

        await prisma.booking.create({
          data: {
            workspaceId: property.workspaceId,
            propertyId: property.id,
            guest: guestName,
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

      // Soft-delete future bookings whose UID disappeared from the feed or is explicitly cancelled
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
        if (!confirmedUids.has(uid) || cancelledUids.has(uid)) {
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

  return apiSuccess({ created, cancelled, errors });
}

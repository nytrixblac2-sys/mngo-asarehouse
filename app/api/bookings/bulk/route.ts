import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { bookingInputSchema, serializeBooking } from "@/lib/bookings";

const bulkInputSchema = z.object({
  propertyId: z.string().uuid(),
  bookings: z.array(bookingInputSchema.omit({ propertyId: true })).min(1).max(1000),
  // Applies to every row in the batch — matches the importer's UI, which
  // asks once per import ("were these already paid, or not yet?") rather
  // than per row. Defaults to EXPECTED: user clarification, 2026-08-04,
  // "confirmed means money was sent" — a batch import should not silently
  // assert payment happened unless the user actually says so, since not
  // every CSV import is of genuinely-past, already-paid stays (e.g. a
  // fresh Airbnb export of upcoming reservations for the rest of the year).
  status: z.enum(["CONFIRMED", "EXPECTED"]).default("EXPECTED"),
});

/**
 * Bulk-creates bookings for historical backfill or future-stay import
 * (CSV import or any other batch source) — Architecture Decision 31
 * ("clean slate, no prev_balance override — real transaction import is
 * the only backfill mechanism") and Decision 44 (generic CSV importer).
 * Every row in a batch shares one property, matching the importer's
 * one-property-per-import UI.
 *
 * Status is caller-supplied per batch (Architecture Decision 63), not
 * always CONFIRMED: a genuinely historical import (the stay and payment
 * both already happened) should be CONFIRMED so it counts in
 * `sumConfirmedIncome` immediately, but a batch of upcoming reservations
 * that haven't been paid out yet should stay EXPECTED until someone
 * actually confirms each one as money arrives — otherwise the app would
 * be asserting income that hasn't happened. `paidAt` is still always
 * server-computed, never client-supplied, and is only set when the
 * batch's status is CONFIRMED — same invariant as the regular /confirm
 * endpoint, applied to every row here instead of one booking at a time.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = bulkInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const { status } = parsed.data;
  const created = await prisma.$transaction(
    parsed.data.bookings.map((b) =>
      prisma.booking.create({
        data: {
          workspaceId: user.workspaceId,
          propertyId: parsed.data.propertyId,
          guest: b.guest,
          checkIn: new Date(b.checkIn),
          checkOut: new Date(b.checkOut),
          amount: b.amount,
          currency: b.currency,
          source: b.source,
          status,
          paidAt: status === "CONFIRMED" ? new Date(b.checkOut) : null,
        },
      })
    )
  );

  return apiSuccess(created.map(serializeBooking));
}

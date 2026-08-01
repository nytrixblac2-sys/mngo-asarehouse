import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { bookingInputSchema, serializeBooking } from "@/lib/bookings";

const bulkInputSchema = z.object({
  propertyId: z.string().uuid(),
  bookings: z.array(bookingInputSchema.omit({ propertyId: true })).min(1).max(1000),
});

/**
 * Bulk-creates bookings for historical backfill (CSV import or any other
 * batch source) — Architecture Decision 31 ("clean slate, no prev_balance
 * override — real transaction import is the only backfill mechanism") and
 * Decision 44 (generic CSV importer). Every row in a batch shares one
 * property, matching the importer's one-property-per-import UI.
 *
 * Unlike POST /api/bookings (which always creates EXPECTED bookings),
 * imported historical bookings are created CONFIRMED with `paidAt` set to
 * their checkout date: the entire point of a historical import is that
 * this income already happened and was already collected, so leaving
 * them EXPECTED would exclude them from `sumConfirmedIncome` and defeat
 * the import's purpose. `paidAt` is still server-computed, never
 * client-supplied — same invariant as the regular /confirm endpoint,
 * applied to every row here instead of one booking at a time.
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
          status: "CONFIRMED",
          paidAt: new Date(b.checkOut),
        },
      })
    )
  );

  return apiSuccess(created.map(serializeBooking));
}

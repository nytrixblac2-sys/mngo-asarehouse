import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { bookingDeleteInputSchema, bookingInputSchema, BookingError, deleteBooking, serializeBooking } from "@/lib/bookings";
import { computeHostelBookingFields, RoomBookingError } from "@/lib/rooms";
import { uniqueBookingCode } from "@/lib/booking-code";

/**
 * Edits a booking's core fields. Deliberately does NOT accept `status` or
 * `paidAt` — those only change through PATCH /api/bookings/[id]/confirm,
 * which sets `paidAt` server-side. Accepting them here would let an edit
 * silently bypass that invariant. Managers only.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId || existing.deletedAt) {
    return apiError("Not found", 404);
  }

  const parsed = bookingInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  if ("roomId" in parsed.data) {
    let fields;
    try {
      fields = await computeHostelBookingFields({
        workspaceId: user.workspaceId,
        roomId: parsed.data.roomId,
        checkIn: parsed.data.checkIn,
        checkOut: parsed.data.checkOut,
        excludeBookingId: params.id,
      });
    } catch (err) {
      if (err instanceof RoomBookingError) return apiError(err.message, 409);
      throw err;
    }

    // Safety net for any HOSTEL booking that somehow still has no
    // bookingCode (e.g. one created before this was fixed to always
    // generate one) — backfilled the first time it's touched again.
    const bookingCode = existing.bookingCode ?? (await uniqueBookingCode());

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        propertyId: parsed.data.propertyId,
        guest: parsed.data.guest,
        checkIn: new Date(parsed.data.checkIn),
        checkOut: new Date(parsed.data.checkOut),
        amount: fields.amount,
        currency: fields.currency,
        source: "LOCAL",
        roomId: parsed.data.roomId,
        passportNumber: parsed.data.passportNumber,
        guestEmail: parsed.data.guestEmail,
        guestPhone: parsed.data.guestPhone,
        bookingCode,
      },
    });
    return apiSuccess(serializeBooking(updated));
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: {
      propertyId: parsed.data.propertyId,
      guest: parsed.data.guest,
      checkIn: new Date(parsed.data.checkIn),
      checkOut: new Date(parsed.data.checkOut),
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      source: parsed.data.source,
      // Editing a RENTAL booking back from HOSTEL shape never happens in
      // practice (workspaces don't mix types), but clear these defensively
      // so a stale roomId/passportNumber can't linger from a prior edit.
      roomId: null,
      passportNumber: null,
      guestEmail: null,
      guestPhone: null,
    },
  });

  return apiSuccess(serializeBooking(updated));
}

/**
 * Deletes a booking, or requests its deletion (Architecture Decision 99)
 * — ACCOUNT_OWNER deletes immediately; anyone else's delete becomes a
 * pending request the owner approves or rejects (see
 * POST /api/bookings/[id]/approve-delete and reject-delete). See
 * lib/bookings.ts deleteBooking for the full rule. Restorable once
 * actually deleted — see POST /api/bookings/[id]/restore.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = bookingDeleteInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  try {
    const booking = await deleteBooking({
      workspaceId: user.workspaceId,
      bookingId: params.id,
      actorRole: user.role,
      actorName: user.name,
      reason: parsed.data.reason,
    });
    return apiSuccess(serializeBooking(booking));
  } catch (err) {
    if (err instanceof BookingError) return apiError(err.message, 409);
    throw err;
  }
}

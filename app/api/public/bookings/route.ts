import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { publicBookingInputSchema, serializeBooking } from "@/lib/bookings";
import { computeHostelBookingFields, RoomBookingError } from "@/lib/rooms";
import { uniqueBookingCode } from "@/lib/booking-code";
import { setGuestSessionCookie } from "@/lib/guest-session";

/**
 * Guest self-service booking from the public /book/[slug] page — the
 * first unauthenticated write path in the app. No staff session; the
 * workspace is identified by its public slug instead. Same price/overlap
 * validation as the staff-side HOSTEL booking flow (lib/rooms.ts
 * computeHostelBookingFields) — a guest booking online must be exactly
 * as trustworthy as one Janet enters manually. On success, immediately
 * issues the guest their signed session cookie (they already know the
 * booking code + name they just supplied, so there's no security reason
 * to make them re-enter it on the very next page).
 */
export async function POST(req: Request) {
  const parsed = publicBookingInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const workspace = await prisma.workspace.findUnique({ where: { slug: parsed.data.workspaceSlug } });
  if (!workspace || workspace.type !== "HOSTEL" || workspace.status !== "ACTIVE") {
    return apiError("Booking is not available for this property", 404);
  }

  const room = await prisma.room.findUnique({ where: { id: parsed.data.roomId } });
  if (!room || room.workspaceId !== workspace.id || !room.active) {
    return apiError("Room not found", 404);
  }

  let fields;
  try {
    fields = await computeHostelBookingFields({
      workspaceId: workspace.id,
      roomId: parsed.data.roomId,
      checkIn: parsed.data.checkIn,
      checkOut: parsed.data.checkOut,
    });
  } catch (err) {
    if (err instanceof RoomBookingError) return apiError(err.message, 409);
    throw err;
  }

  const bookingCode = await uniqueBookingCode();

  const created = await prisma.booking.create({
    data: {
      workspaceId: workspace.id,
      propertyId: room.propertyId,
      guest: parsed.data.guest,
      checkIn: new Date(parsed.data.checkIn),
      checkOut: new Date(parsed.data.checkOut),
      amount: fields.amount,
      currency: fields.currency,
      source: "WEBSITE",
      status: "EXPECTED",
      roomId: parsed.data.roomId,
      passportNumber: parsed.data.passportNumber,
      guestEmail: parsed.data.guestEmail,
      guestPhone: parsed.data.guestPhone,
      bookingCode,
    },
  });

  await setGuestSessionCookie(created.id);

  return apiSuccess(serializeBooking(created));
}

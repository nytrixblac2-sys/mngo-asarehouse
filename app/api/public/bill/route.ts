import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeBooking } from "@/lib/bookings";
import { serializeRoom } from "@/lib/rooms";
import { serializeOrder } from "@/lib/orders";
import { getGuestSessionBooking } from "@/lib/guest-session";

/**
 * A guest's live running bill — room charge + every food order placed
 * against their stay so far, updating as they (or Janet, on their behalf)
 * order more. Identity comes entirely from the signed session cookie
 * (lib/guest-session.ts), never from a client-supplied bookingId.
 */
export async function GET() {
  const booking = await getGuestSessionBooking();
  if (!booking) return apiError("Not signed in", 401);

  const [property, room, orders] = await Promise.all([
    prisma.property.findUnique({ where: { id: booking.propertyId }, select: { name: true } }),
    booking.roomId ? prisma.room.findUnique({ where: { id: booking.roomId } }) : null,
    prisma.order.findMany({ where: { bookingId: booking.id }, include: { items: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const foodTotal = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0),
    0
  );
  const roomCharge = Number(booking.amount);

  return apiSuccess({
    propertyName: property?.name ?? "",
    booking: serializeBooking(booking),
    room: room ? serializeRoom(room) : null,
    orders: orders.map(serializeOrder),
    roomCharge,
    foodTotal,
    grandTotal: roomCharge + foodTotal,
  });
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkoutInputSchema, serializeBooking } from "@/lib/bookings";

/**
 * Marks a HOSTEL booking's guest as checked out. `checkedOutAt` is always
 * server-set here, never client-supplied — same invariant as `paidAt`
 * (context/02-architecture-context.md invariant #4). Gates two things:
 * ordering stops (lib/orders.ts createGuestOrder rejects new orders once
 * this is set) and the receipt becomes final. Managers only. Only
 * meaningful for room bookings — RENTAL bookings have no roomId and no
 * concept of "checking out" in this app.
 *
 * Also takes the guest's payment method (Architecture Decision 83) —
 * checkout is realistically also the payment moment, so this marks the
 * booking CONFIRMED/paidAt too if it wasn't already (an existing paidAt
 * from an earlier confirmation is preserved, not overwritten). And it
 * auto-creates an OPEN `ROOM_DIRTY` Issue against the room, so
 * housekeeping shows up in Issues & Schedules without Janet having to
 * remember to log it herself every time a guest leaves.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }
  if (!existing.roomId) {
    return apiError("Only room bookings can be checked out", 400);
  }
  if (existing.checkedOutAt) {
    return apiError("This guest is already checked out", 400);
  }

  const parsed = checkoutInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const room = await prisma.room.findUnique({ where: { id: existing.roomId } });
  const today = new Date(new Date().toISOString().slice(0, 10));

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: params.id },
      data: {
        checkedOutAt: new Date(),
        paymentMethod: parsed.data.paymentMethod,
        status: "CONFIRMED",
        paidAt: existing.paidAt ?? today,
      },
    }),
    prisma.issue.create({
      data: {
        workspaceId: user.workspaceId,
        propertyId: existing.propertyId,
        date: today,
        type: "ROOM_DIRTY",
        description: `${room?.name ?? "Room"} needs cleaning after checkout.`,
        guest: existing.guest,
        roomId: existing.roomId,
        status: "OPEN",
        statusHistory: { create: [{ status: "OPEN" }] },
      },
    }),
  ]);

  return apiSuccess(serializeBooking(updated));
}

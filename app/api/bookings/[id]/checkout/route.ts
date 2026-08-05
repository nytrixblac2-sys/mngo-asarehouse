import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeBooking } from "@/lib/bookings";

/**
 * Marks a HOSTEL booking's guest as checked out. `checkedOutAt` is always
 * server-set here, never client-supplied — same invariant as `paidAt`
 * (context/02-architecture-context.md invariant #4). Gates two things:
 * ordering stops (lib/orders.ts createGuestOrder rejects new orders once
 * this is set) and the receipt becomes final. Managers only. Only
 * meaningful for room bookings — RENTAL bookings have no roomId and no
 * concept of "checking out" in this app.
 */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
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

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { checkedOutAt: new Date() },
  });

  return apiSuccess(serializeBooking(updated));
}

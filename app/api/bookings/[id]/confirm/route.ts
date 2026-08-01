import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { Booking } from "@/lib/types";

/**
 * Confirms a booking's payment. `paidAt` is set to the server date here —
 * never accepted from the client. context/02-architecture-context.md
 * invariant #4. Managers only, matching context/07-mockup.jsx (the
 * "Confirm payout" button only renders for canEdit sessions) — enforced
 * here too, not just hidden client-side.
 */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const today = new Date();
  const paidAt = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status: "CONFIRMED", paidAt },
  });

  const data: Booking = {
    id: updated.id,
    workspaceId: updated.workspaceId,
    propertyId: updated.propertyId,
    guest: updated.guest,
    checkIn: updated.checkIn.toISOString().slice(0, 10),
    checkOut: updated.checkOut.toISOString().slice(0, 10),
    amount: Number(updated.amount),
    currency: updated.currency,
    source: updated.source,
    status: updated.status,
    paidAt: updated.paidAt ? updated.paidAt.toISOString().slice(0, 10) : null,
  };

  return apiSuccess(data);
}

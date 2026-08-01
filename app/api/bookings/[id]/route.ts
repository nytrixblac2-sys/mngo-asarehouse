import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { bookingInputSchema, serializeBooking } from "@/lib/bookings";

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
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = bookingInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
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
    },
  });

  return apiSuccess(serializeBooking(updated));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  await prisma.booking.delete({ where: { id: params.id } });
  return apiSuccess({ id: params.id });
}

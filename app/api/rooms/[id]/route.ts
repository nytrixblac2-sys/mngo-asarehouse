import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { roomInputSchema, serializeRoom } from "@/lib/rooms";

/** Edits a room's name/rate/currency/active flag. Managers only. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.room.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = roomInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const updated = await prisma.room.update({
    where: { id: params.id },
    data: {
      propertyId: parsed.data.propertyId,
      name: parsed.data.name,
      pricePerNight: parsed.data.pricePerNight,
      currency: parsed.data.currency,
      active: parsed.data.active ?? existing.active,
    },
  });

  return apiSuccess(serializeRoom(updated));
}

/**
 * Deletes a room type. Managers only. Existing bookings referencing this
 * room keep their own historical roomId->null via the schema's ON DELETE
 * SET NULL (prisma/schema.prisma Booking.room relation) — deleting a room
 * type doesn't delete past stays.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.room.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  await prisma.room.delete({ where: { id: params.id } });
  return apiSuccess({ id: params.id });
}

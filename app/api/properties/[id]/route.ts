import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeProperty, updatePropertySchema } from "@/lib/properties";

/**
 * Updates a property's color/currencies/allocation/rooms/facilities.
 * Never accepts prevBalance — clean slate per Architecture Decision 31,
 * no opening-balance override exists. Managers only.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = updatePropertySchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      color: parsed.data.color,
      currencies: parsed.data.currencies,
      allocation: parsed.data.allocation,
      rooms: parsed.data.rooms,
      facilities: parsed.data.facilities,
    },
  });

  return apiSuccess(serializeProperty(updated));
}

/** Refuses to delete a workspace's last property — an empty workspace
 * would orphan any Property Owners already assigned to it, and every
 * screen assumes at least one property can exist once onboarding is
 * done. Matches the mockup's client-side `properties.length > 1` gate,
 * enforced here too rather than trusting only the UI. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const count = await prisma.property.count({ where: { workspaceId: user.workspaceId } });
  if (count <= 1) return apiError("Cannot delete the workspace's last property", 400);

  await prisma.property.delete({ where: { id: params.id } });
  return apiSuccess({ id: params.id });
}

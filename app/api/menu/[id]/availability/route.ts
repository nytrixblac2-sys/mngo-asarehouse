import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { availabilityInputSchema, serializeMenuItem } from "@/lib/menu";

/**
 * Toggles just `isAvailableToday` — the Kitchen screen's daily curation
 * action. Split from the full edit PATCH so flipping a switch doesn't
 * require resending name/category/price/currency. Managers only.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = availabilityInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const updated = await prisma.menuItem.update({
    where: { id: params.id },
    data: { isAvailableToday: parsed.data.isAvailableToday },
  });

  return apiSuccess(serializeMenuItem(updated));
}

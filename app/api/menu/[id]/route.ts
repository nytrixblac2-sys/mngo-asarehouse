import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { menuItemInputSchema, serializeMenuItem } from "@/lib/menu";
import { PinLockedError, verifyWorkspacePin } from "@/lib/workspace-pin";

/**
 * Edits a menu item's name/category/price/currency/alwaysAvailable/station.
 * Managers only. A real price change (Architecture Decision 82, "same as
 * when deleting an order") requires the workspace PIN unless the actor is
 * the ACCOUNT_OWNER — renaming, recategorizing, or reclassifying station
 * with no price change needs no PIN.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = menuItemInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const priceChanged = parsed.data.price !== Number(existing.price);
  if (priceChanged && user.role !== "ACCOUNT_OWNER") {
    try {
      if (!parsed.data.pin || !(await verifyWorkspacePin(user.workspaceId, parsed.data.pin))) {
        return apiError("Incorrect PIN", 403);
      }
    } catch (err) {
      if (err instanceof PinLockedError) return apiError(err.message, 429);
      throw err;
    }
  }

  const updated = await prisma.menuItem.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      price: parsed.data.price,
      currency: parsed.data.currency,
      alwaysAvailable: parsed.data.alwaysAvailable ?? existing.alwaysAvailable,
      station: parsed.data.station ?? existing.station,
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl } : {}),
    },
  });

  return apiSuccess(serializeMenuItem(updated));
}

/** Removes a menu item from the master menu. Managers only. Past
 * OrderItem rows keep their own snapshotted name/price, unaffected. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  await prisma.menuItem.delete({ where: { id: params.id } });
  return apiSuccess({ id: params.id });
}

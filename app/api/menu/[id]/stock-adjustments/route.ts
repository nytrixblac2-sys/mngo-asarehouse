import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeMenuItem } from "@/lib/menu";
import { stockAdjustmentInputSchema, serializeStockAdjustment } from "@/lib/stock";

/**
 * Records a manual restock/correction against one MenuItem's stock — the
 * only write path for stock changes other than an automatic sale
 * decrement (app/api/shop/[slug]/orders). Also how tracking gets turned on
 * for a previously-untracked item: `stockQuantity` starts at `null`
 * (treated as 0 here), so the first adjustment is really "set the
 * starting count." Managers only, same as every other menu write.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  // Inventory tracking is Starter-and-up — same enforcement as POST/PATCH
  // /api/menu, needed here too since this is the other way tracking can
  // start (the first adjustment on a previously-untracked item).
  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId }, select: { type: true, plan: true } });
  if (workspace?.type === "STORE" && workspace.plan === "FREE") {
    return apiError("Inventory tracking requires the Starter plan or higher.", 403);
  }

  const parsed = stockAdjustmentInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const newQuantity = (existing.stockQuantity ?? 0) + parsed.data.delta;
  if (newQuantity < 0) {
    return apiError(`That would take stock below zero (currently ${existing.stockQuantity ?? 0}).`, 400);
  }

  const [updated] = await prisma.$transaction([
    prisma.menuItem.update({ where: { id: existing.id }, data: { stockQuantity: newQuantity } }),
    prisma.stockAdjustment.create({
      data: {
        workspaceId: user.workspaceId,
        menuItemId: existing.id,
        delta: parsed.data.delta,
        reason: parsed.data.reason,
      },
    }),
  ]);

  return apiSuccess(serializeMenuItem(updated));
}

/** One item's own stock history, newest first. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const rows = await prisma.stockAdjustment.findMany({
    where: { menuItemId: existing.id },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(rows.map(serializeStockAdjustment));
}

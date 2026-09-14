import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

const shopOrderInputSchema = z.object({
  guestName: z.string().min(1),
  guestPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
});

/** Thrown inside the transaction below for a condition that should reach
 * the client as a 400, not a 500 — caught once, outside the transaction. */
class ShopOrderError extends Error {}

/**
 * Public endpoint — no auth. Guests submit a shop order from /shop/[slug].
 * Items are validated against the workspace's shop menu items.
 */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
    select: { id: true, type: true, hasShop: true, plan: true },
  });
  if (!workspace || (workspace.type !== "STORE" && !workspace.hasShop)) {
    return apiError("Shop not found", 404);
  }
  // See GET /api/shop/[slug]'s matching comment — Free-tier Store, no
  // online orders yet, enforced server-side since this is public.
  if (workspace.type === "STORE" && workspace.plan === "FREE") {
    return apiError("This store isn't accepting online orders yet.", 403);
  }

  const parsed = shopOrderInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const menuItemIds = parsed.data.items.map((i) => i.menuItemId);

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Read stock inside the transaction, not before it — two guests
      // checking out the same last unit at the same moment must not both
      // pass a stale outside-transaction stock check.
      const menuItems = await tx.menuItem.findMany({
        where: { id: { in: menuItemIds }, workspaceId: workspace.id, station: "SHOP" },
      });
      if (menuItems.length !== menuItemIds.length) throw new ShopOrderError("One or more items not found");

      const menuMap = new Map(menuItems.map((m) => [m.id, m]));
      for (const i of parsed.data.items) {
        const item = menuMap.get(i.menuItemId)!;
        if (item.stockQuantity !== null && item.stockQuantity < i.quantity) {
          throw new ShopOrderError(`Not enough stock for ${item.name} — ${item.stockQuantity} left.`);
        }
      }

      const created = await tx.shopOrder.create({
        data: {
          workspaceId: workspace.id,
          guestName: parsed.data.guestName,
          guestPhone: parsed.data.guestPhone ?? null,
          notes: parsed.data.notes ?? null,
          items: {
            create: parsed.data.items.map((i) => {
              const item = menuMap.get(i.menuItemId)!;
              return {
                menuItemId: i.menuItemId,
                name: item.name,
                quantity: i.quantity,
                unitPrice: item.price,
                currency: item.currency,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Tracked items only (stockQuantity !== null) — decrement on hand
      // and log the sale as a StockAdjustment, same audit trail a manual
      // restock uses.
      for (const i of parsed.data.items) {
        const item = menuMap.get(i.menuItemId)!;
        if (item.stockQuantity !== null) {
          await tx.menuItem.update({
            where: { id: item.id },
            data: { stockQuantity: { decrement: i.quantity } },
          });
          await tx.stockAdjustment.create({
            data: {
              workspaceId: workspace.id,
              menuItemId: item.id,
              delta: -i.quantity,
              reason: `Sale to ${parsed.data.guestName}`,
            },
          });
        }
      }

      return created;
    });
  } catch (err) {
    if (err instanceof ShopOrderError) return apiError(err.message, 400);
    throw err;
  }

  return apiSuccess({
    id: order.id,
    guestName: order.guestName,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      currency: i.currency,
    })),
  });
}

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

/**
 * Public endpoint — no auth. Guests submit a shop order from /shop/[slug].
 * Items are validated against the workspace's shop menu items.
 */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
    select: { id: true, hasShop: true },
  });
  if (!workspace || !workspace.hasShop) return apiError("Shop not found", 404);

  const parsed = shopOrderInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const menuItemIds = parsed.data.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, workspaceId: workspace.id, station: "SHOP" },
  });
  if (menuItems.length !== menuItemIds.length) return apiError("One or more items not found", 400);

  const menuMap = new Map(menuItems.map((m) => [m.id, m]));

  const order = await prisma.shopOrder.create({
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

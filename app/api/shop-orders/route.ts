import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { ShopOrder } from "@/lib/types";

function serialize(o: {
  id: string; workspaceId: string; guestName: string; guestPhone: string | null;
  notes: string | null; status: "OPEN" | "IN_PROGRESS" | "RESOLVED"; createdAt: Date;
  items: { id: string; menuItemId: string | null; name: string; quantity: number; unitPrice: unknown; currency: "GHS" | "EUR" }[];
}): ShopOrder {
  return {
    id: o.id,
    workspaceId: o.workspaceId,
    guestName: o.guestName,
    guestPhone: o.guestPhone,
    notes: o.notes,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: String(i.unitPrice),
      currency: i.currency,
    })),
  };
}

/** Admin: list all shop orders for this workspace. Owner and Co-Manager only. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const orders = await prisma.shopOrder.findMany({
    where: { workspaceId: user.workspaceId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(orders.map(serialize));
}

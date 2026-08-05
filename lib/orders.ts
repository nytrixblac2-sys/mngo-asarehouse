import { z } from "zod";
import { prisma } from "./prisma";
import type { Order } from "./types";

export const orderInputSchema = z.object({
  bookingId: z.string().uuid(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export class OrderError extends Error {}

type OrderRow = {
  id: string;
  workspaceId: string;
  bookingId: string;
  createdAt: Date;
  items: {
    id: string;
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: unknown;
    currency: Order["items"][number]["currency"];
  }[];
};

export function serializeOrder(o: OrderRow): Order {
  return {
    id: o.id,
    workspaceId: o.workspaceId,
    bookingId: o.bookingId,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      currency: i.currency,
    })),
  };
}

/**
 * Places a food/drink order against a guest's stay — used both by staff
 * ordering on a guest's behalf (POST /api/orders) and, in a later phase,
 * by the guest's own public ordering screen. Only today's available items
 * can be ordered (same `isAvailableToday` gate Janet curates on the
 * Kitchen screen) — if it's not on today's list, neither staff nor guests
 * should be able to order it, one consistent rule rather than two. Each
 * `OrderItem` snapshots the menu item's current name/price/currency so a
 * later menu edit never rewrites this order's historical total.
 */
export async function createGuestOrder(params: {
  workspaceId: string;
  bookingId: string;
  items: { menuItemId: string; quantity: number }[];
}) {
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.workspaceId !== params.workspaceId) {
    throw new OrderError("Booking not found");
  }
  if (booking.checkedOutAt) {
    throw new OrderError("This guest has already checked out");
  }

  const menuItemIds = params.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, workspaceId: params.workspaceId },
  });
  if (menuItems.length !== new Set(menuItemIds).size) {
    throw new OrderError("One or more menu items were not found");
  }
  const unavailable = menuItems.filter((m) => !m.isAvailableToday);
  if (unavailable.length > 0) {
    throw new OrderError(
      `${unavailable.map((m) => m.name).join(", ")} ${unavailable.length === 1 ? "is" : "are"} not available today`
    );
  }

  const byId = new Map(menuItems.map((m) => [m.id, m]));
  const order = await prisma.order.create({
    data: {
      workspaceId: params.workspaceId,
      bookingId: params.bookingId,
      items: {
        create: params.items.map(({ menuItemId, quantity }) => {
          const item = byId.get(menuItemId)!;
          return { menuItemId, name: item.name, quantity, unitPrice: item.price, currency: item.currency };
        }),
      },
    },
    include: { items: true },
  });

  return order;
}

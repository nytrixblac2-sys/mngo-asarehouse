import { z } from "zod";
import { prisma } from "./prisma";
import { isMenuItemOrderable } from "./menu";
import { verifyWorkspacePin } from "./workspace-pin";
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

export const orderStatusInputSchema = z.object({
  station: z.enum(["KITCHEN", "BAR"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export const orderDeleteInputSchema = z.object({
  reason: z.string().min(1),
  /** Required for a CO_MANAGER-initiated delete, ignored for
   * ACCOUNT_OWNER — see deleteOrder. */
  pin: z.string().optional(),
});

export class OrderError extends Error {}

type OrderRow = {
  id: string;
  workspaceId: string;
  bookingId: string;
  createdAt: Date;
  kitchenStatus: Order["kitchenStatus"];
  barStatus: Order["barStatus"];
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  items: {
    id: string;
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: unknown;
    currency: Order["items"][number]["currency"];
    station: Order["items"][number]["station"];
  }[];
};

export function serializeOrder(o: OrderRow): Order {
  return {
    id: o.id,
    workspaceId: o.workspaceId,
    bookingId: o.bookingId,
    createdAt: o.createdAt.toISOString(),
    kitchenStatus: o.kitchenStatus,
    barStatus: o.barStatus,
    deletedAt: o.deletedAt ? o.deletedAt.toISOString() : null,
    deletedBy: o.deletedBy,
    deleteReason: o.deleteReason,
    items: o.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      currency: i.currency,
      station: i.station,
    })),
  };
}

/**
 * Places a food/drink order against a guest's stay — used both by staff
 * ordering on a guest's behalf (POST /api/orders) and by the guest's own
 * public ordering screen (POST /api/public/orders). Only orderable items
 * can be ordered — either genuinely always-available (breakfast, drinks,
 * the all-day menu) or toggled available today (rotating lunch/dinner
 * items), same `isMenuItemOrderable` rule Janet curates on the Kitchen
 * screen — if it's not orderable, neither staff nor guests should be able
 * to order it, one consistent rule rather than two. Each `OrderItem`
 * snapshots the menu item's current name/price/currency so a later menu
 * edit never rewrites this order's historical total.
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
  const unavailable = menuItems.filter((m) => !isMenuItemOrderable(m));
  if (unavailable.length > 0) {
    throw new OrderError(
      `${unavailable.map((m) => m.name).join(", ")} ${unavailable.length === 1 ? "is" : "are"} not available today`
    );
  }

  const byId = new Map(menuItems.map((m) => [m.id, m]));
  const orderedStations = new Set(params.items.map(({ menuItemId }) => byId.get(menuItemId)!.station));
  const order = await prisma.order.create({
    data: {
      workspaceId: params.workspaceId,
      bookingId: params.bookingId,
      kitchenStatus: orderedStations.has("KITCHEN") ? "OPEN" : null,
      barStatus: orderedStations.has("BAR") ? "OPEN" : null,
      items: {
        create: params.items.map(({ menuItemId, quantity }) => {
          const item = byId.get(menuItemId)!;
          return {
            menuItemId,
            name: item.name,
            quantity,
            unitPrice: item.price,
            currency: item.currency,
            station: item.station,
          };
        }),
      },
    },
    include: { items: true },
  });

  return order;
}

/**
 * Advances one station's fulfillment status on an order — used by the
 * Kitchen and Bar screens. The two stations are tracked independently
 * (see Order model doc comment): marking food "Delivered" never touches
 * the drinks side of the same order.
 */
export async function setOrderStationStatus(params: {
  workspaceId: string;
  orderId: string;
  station: "KITCHEN" | "BAR";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.workspaceId !== params.workspaceId) {
    throw new OrderError("Order not found");
  }
  const currentStatus = params.station === "KITCHEN" ? order.kitchenStatus : order.barStatus;
  if (currentStatus === null) {
    throw new OrderError(`This order has no ${params.station.toLowerCase()} items`);
  }

  return prisma.order.update({
    where: { id: params.orderId },
    data: params.station === "KITCHEN" ? { kitchenStatus: params.status } : { barStatus: params.status },
    include: { items: true },
  });
}

/**
 * Soft-deletes an order — it disappears from the guest's bill/receipt and
 * from the Kitchen/Bar screens, but stays queryable forever for the owner
 * (Architecture Decision 79's "deleted orders" log). A manager-initiated
 * delete (actorRole !== ACCOUNT_OWNER) requires the workspace PIN; the
 * owner (who sets the PIN) can delete without it. A reason is always
 * required either way, for the audit trail.
 */
export async function deleteOrder(params: {
  workspaceId: string;
  orderId: string;
  actorRole: "ACCOUNT_OWNER" | "CO_MANAGER" | "PROPERTY_OWNER";
  actorName: string;
  reason: string;
  pin?: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.workspaceId !== params.workspaceId) {
    throw new OrderError("Order not found");
  }
  if (order.deletedAt) {
    throw new OrderError("This order was already deleted");
  }

  if (params.actorRole !== "ACCOUNT_OWNER") {
    if (!params.pin || !(await verifyWorkspacePin(params.workspaceId, params.pin))) {
      throw new OrderError("Incorrect PIN");
    }
  }

  return prisma.order.update({
    where: { id: params.orderId },
    data: { deletedAt: new Date(), deletedBy: params.actorName, deleteReason: params.reason.trim() },
    include: { items: true },
  });
}

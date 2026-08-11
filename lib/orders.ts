import { z } from "zod";
import { prisma } from "./prisma";
import { isMenuItemOrderable } from "./menu";
import { STATION_STATUS_FIELD } from "./labels";
import type { MenuStation, Order } from "./types";

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
  station: z.enum(["KITCHEN", "BAR", "SHOP", "EXPERIENCE"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export const orderDeleteInputSchema = z.object({
  reason: z.string().min(1),
});

export class OrderError extends Error {}

type OrderRow = {
  id: string;
  workspaceId: string;
  bookingId: string;
  createdAt: Date;
  kitchenStatus: Order["kitchenStatus"];
  barStatus: Order["barStatus"];
  shopStatus: Order["shopStatus"];
  experienceStatus: Order["experienceStatus"];
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  deleteRequestedAt: Date | null;
  deleteRequestedBy: string | null;
  items: {
    id: string;
    menuItemId: string | null;
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
    shopStatus: o.shopStatus,
    experienceStatus: o.experienceStatus,
    deletedAt: o.deletedAt ? o.deletedAt.toISOString() : null,
    deletedBy: o.deletedBy,
    deleteReason: o.deleteReason,
    deleteRequestedAt: o.deleteRequestedAt ? o.deleteRequestedAt.toISOString() : null,
    deleteRequestedBy: o.deleteRequestedBy,
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
  if (!booking || booking.workspaceId !== params.workspaceId || booking.deletedAt) {
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
  const statusColumns = Object.fromEntries(
    Object.entries(STATION_STATUS_FIELD).map(([station, field]) => [field, orderedStations.has(station as MenuStation) ? "OPEN" : null])
  );
  const order = await prisma.order.create({
    data: {
      workspaceId: params.workspaceId,
      bookingId: params.bookingId,
      ...statusColumns,
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
 * Kitchen, Bar, Shop, and Experiences screens. Every station is tracked
 * independently (see Order model doc comment): marking food "Delivered"
 * never touches the drinks, shop, or experience side of the same order.
 */
export async function setOrderStationStatus(params: {
  workspaceId: string;
  orderId: string;
  station: MenuStation;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.workspaceId !== params.workspaceId) {
    throw new OrderError("Order not found");
  }
  const field = STATION_STATUS_FIELD[params.station];
  const currentStatus = order[field];
  if (currentStatus === null) {
    throw new OrderError(`This order has no ${params.station.toLowerCase()} items`);
  }

  return prisma.order.update({
    where: { id: params.orderId },
    data: { [field]: params.status },
    include: { items: true },
  });
}

/**
 * Deletes an order, or requests its deletion (Architecture Decision 99,
 * same mechanism as lib/bookings.ts deleteBooking — see its doc comment).
 * ACCOUNT_OWNER deletes immediately: it disappears from the guest's bill/
 * receipt and the fulfillment screens, but stays queryable forever in the
 * owner-only "deleted orders" log (Architecture Decision 79). Anyone
 * else's delete becomes a pending request instead — the order keeps
 * showing everywhere as normal until approveOrderDeletion or
 * rejectOrderDeletion resolves it. Replaces the previous PIN-gate for
 * deletion specifically (menu price changes still use the PIN). A reason
 * is always required, for the audit trail either way.
 */
export async function deleteOrder(params: {
  workspaceId: string;
  orderId: string;
  actorRole: "ACCOUNT_OWNER" | "CO_MANAGER" | "PROPERTY_OWNER";
  actorName: string;
  reason: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.workspaceId !== params.workspaceId) {
    throw new OrderError("Order not found");
  }
  if (order.deletedAt) {
    throw new OrderError("This order was already deleted");
  }
  if (order.deleteRequestedAt) {
    throw new OrderError("A deletion request is already pending for this order");
  }

  if (params.actorRole === "ACCOUNT_OWNER") {
    return prisma.order.update({
      where: { id: params.orderId },
      data: { deletedAt: new Date(), deletedBy: params.actorName, deleteReason: params.reason.trim() },
      include: { items: true },
    });
  }

  return prisma.order.update({
    where: { id: params.orderId },
    data: { deleteRequestedAt: new Date(), deleteRequestedBy: params.actorName, deleteReason: params.reason.trim() },
    include: { items: true },
  });
}

/** Owner approves a pending delete request, finalizing it into an actual
 * soft-delete. `deletedBy` credits whoever originally requested it. */
export async function approveOrderDeletion(params: { workspaceId: string; orderId: string }) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.workspaceId !== params.workspaceId) {
    throw new OrderError("Order not found");
  }
  if (!order.deleteRequestedAt) {
    throw new OrderError("No pending deletion request for this order");
  }

  return prisma.order.update({
    where: { id: params.orderId },
    data: {
      deletedAt: new Date(),
      deletedBy: order.deleteRequestedBy,
      deleteRequestedAt: null,
      deleteRequestedBy: null,
    },
    include: { items: true },
  });
}

/** Owner rejects a pending delete request — nothing is deleted, the
 * request (and its reason) is just cleared. */
export async function rejectOrderDeletion(params: { workspaceId: string; orderId: string }) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.workspaceId !== params.workspaceId) {
    throw new OrderError("Order not found");
  }
  if (!order.deleteRequestedAt) {
    throw new OrderError("No pending deletion request for this order");
  }

  return prisma.order.update({
    where: { id: params.orderId },
    data: { deleteRequestedAt: null, deleteRequestedBy: null, deleteReason: null },
    include: { items: true },
  });
}

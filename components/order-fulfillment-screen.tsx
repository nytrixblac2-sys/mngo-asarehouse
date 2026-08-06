"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useOrders, useUpdateOrderStatus } from "@/lib/queries/orders";
import { useBookings } from "@/lib/queries/bookings";
import { useRooms } from "@/lib/queries/rooms";
import { useWorkspace } from "@/lib/queries/workspace";
import { C } from "@/lib/colors";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, STATION_STATUS_FIELD } from "@/lib/labels";
import type { IssueStatus, MenuStation } from "@/lib/types";

const STATUS_OPTIONS: IssueStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

const STATION_DESCRIPTION: Record<MenuStation, string> = {
  KITCHEN: "Food orders waiting to be prepared and served.",
  BAR: "Drink orders waiting to be prepared and served.",
  SHOP: "Shop purchases waiting to be handed over.",
  EXPERIENCE: "Booked experiences waiting to happen.",
};

/**
 * Order fulfillment tickets for one station (Kitchen, Bar, Shop, or
 * Experiences) — shared by app/(app)/kitchen/page.tsx,
 * app/(app)/bar/page.tsx, app/(app)/shop/page.tsx, and
 * app/(app)/experiences/page.tsx, since all four screens are identical
 * apart from which of Order.kitchenStatus/barStatus/shopStatus/
 * experienceStatus they read and which of each order's items (by
 * MenuItem.station) they show. See Order model doc comment
 * (prisma/schema.prisma) and Architecture Decisions 79/91 for the
 * independent-per-station design.
 */
export function OrderFulfillmentScreen({ station, title }: { station: MenuStation; title: string }) {
  const { effectiveCanEdit } = useEffectiveUser();
  const workspace = useWorkspace().data;
  const ordersQuery = useOrders();
  const bookingsQuery = useBookings();
  const roomsQuery = useRooms();
  const updateStatus = useUpdateOrderStatus();
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!printingOrderId) return;
    const timer = setTimeout(() => window.print(), 50);
    const handleAfterPrint = () => setPrintingOrderId(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printingOrderId]);

  if (workspace && workspace.type !== "HOSTEL") {
    return <p className="text-sm" style={{ color: C.muted }}>The {title} screen is only available for hostel-style workspaces.</p>;
  }
  if (ordersQuery.isLoading || bookingsQuery.isLoading || roomsQuery.isLoading) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }
  if (ordersQuery.isError || bookingsQuery.isError || roomsQuery.isError) {
    return <p className="text-sm text-destructive">Something went wrong loading {title.toLowerCase()} orders.</p>;
  }

  const bookings = bookingsQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const statusField = STATION_STATUS_FIELD[station];

  const tickets = (ordersQuery.data ?? [])
    .filter((o) => o[statusField] !== null && o.deletedAt === null)
    .map((o) => {
      const booking = bookings.find((b) => b.id === o.bookingId);
      const room = booking?.roomId ? rooms.find((r) => r.id === booking.roomId) : undefined;
      const items = o.items.filter((i) => i.station === station);
      return { order: o, booking, room, items, status: o[statusField] as IssueStatus };
    })
    .sort((a, b) => {
      const rank = (s: IssueStatus) => (s === "OPEN" ? 0 : s === "IN_PROGRESS" ? 1 : 2);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return a.order.createdAt.localeCompare(b.order.createdAt);
    });

  const printingTicket = tickets.find((t) => t.order.id === printingOrderId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>{title}</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>{STATION_DESCRIPTION[station]}</p>
      </div>

      {tickets.length === 0 && (
        <p className="text-sm" style={{ color: C.muted }}>No {title.toLowerCase()} orders right now.</p>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {tickets.map(({ order, booking, room, items, status }) => (
          <Card key={order.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: C.text }}>{booking?.guest ?? "Unknown guest"}</p>
                <p className="text-xs" style={{ color: C.muted }}>{room?.name ?? "No room"}</p>
              </div>
              <Pill tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Pill>
            </div>

            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <p key={item.id} className="text-sm" style={{ color: C.text }}>
                  {item.quantity}× {item.name}
                </p>
              ))}
            </div>

            <p className="text-xs" style={{ color: C.muted }}>
              {new Date(order.createdAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
            </p>

            {effectiveCanEdit && (
              <div className="flex gap-2 flex-wrap pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus.mutate({ orderId: order.id, station, status: s })}
                    disabled={updateStatus.isPending}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: status === s ? C.text : C.bg,
                      color: status === s ? "#fff" : C.text,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {ORDER_STATUS_LABEL[s]}
                  </button>
                ))}
                <button
                  onClick={() => setPrintingOrderId(order.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
                >
                  <Printer size={12} /> Print
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {printingTicket && (
        <div className="print-ticket">
          <p style={{ fontSize: 20, fontWeight: 700 }}>{title} ticket</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>{printingTicket.booking?.guest ?? "Unknown guest"}</p>
          <p style={{ fontSize: 14 }}>{printingTicket.room?.name ?? "No room"}</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            {new Date(printingTicket.order.createdAt).toLocaleString()}
          </p>
          <div style={{ marginTop: 16 }}>
            {printingTicket.items.map((item) => (
              <p key={item.id} style={{ fontSize: 16, marginTop: 6 }}>
                {item.quantity}× {item.name}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

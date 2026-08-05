"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/components/primitives";
import { useDeletedOrders } from "@/lib/queries/orders";
import { useBookings } from "@/lib/queries/bookings";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";

/**
 * Owner-only audit log of soft-deleted orders (Architecture Decision 79)
 * — "owner should be able to see orders that are deleted so he can ask
 * about it later." Every deletion is permanent history here regardless of
 * who deleted it or when; nothing in this view can be un-deleted (there's
 * no restore — the guest's bill has already moved on).
 */
export function DeletedOrdersLog() {
  const deletedOrdersQuery = useDeletedOrders();
  const bookingsQuery = useBookings();
  const orders = deletedOrdersQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];

  if (deletedOrdersQuery.isLoading || bookingsQuery.isLoading) return null;
  if (orders.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: C.muted }}>
        <Trash2 size={12} /> Deleted orders
      </p>
      <div className="flex flex-col gap-2">
        {[...orders].reverse().map((order) => {
          const booking = bookings.find((b) => b.id === order.bookingId);
          const total = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
          const currency = order.items[0]?.currency;
          return (
            <div key={order.id} className="p-3 rounded-xl" style={{ background: C.bg }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{booking?.guest ?? "Unknown guest"}</p>
                {currency && <p className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(total, currency)}</p>}
              </div>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
              </p>
              <p className="text-xs mt-1.5" style={{ color: C.muted }}>
                Deleted by {order.deletedBy} {order.deletedAt && new Date(order.deletedAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
                {order.deleteReason ? ` — "${order.deleteReason}"` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

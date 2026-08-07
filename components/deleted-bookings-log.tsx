"use client";

import { useState } from "react";
import { Trash2, Undo2 } from "lucide-react";
import { Card } from "@/components/primitives";
import { useDeletedBookings, useRestoreBooking } from "@/lib/queries/bookings";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";

/**
 * Owner-only audit log of soft-deleted bookings (Architecture Decision 93)
 * — same "owner should be able to see what was deleted, and by whom" need
 * as DeletedOrdersLog (Architecture Decision 79), triggered by a real
 * incident where a manager couldn't find stays that turned out to still be
 * in the database (a display bug, not a deletion — but it surfaced that
 * there was no way to actually check). Unlike orders, a deleted booking
 * can be restored — a guest's stay is much more consequential to lose than
 * one food order.
 */
export function DeletedBookingsLog() {
  const deletedBookingsQuery = useDeletedBookings();
  const restoreBooking = useRestoreBooking();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const bookings = deletedBookingsQuery.data ?? [];

  if (deletedBookingsQuery.isLoading) return null;
  if (bookings.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: C.muted }}>
        <Trash2 size={12} /> Deleted stays
      </p>
      <div className="flex flex-col gap-2">
        {[...bookings].reverse().map((b) => (
          <div key={b.id} className="p-3 rounded-xl" style={{ background: C.bg }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: C.text }}>{b.guest}</p>
              <p className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(b.amount, b.currency)}</p>
            </div>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              {b.checkIn} → {b.checkOut}
            </p>
            <p className="text-xs mt-1.5" style={{ color: C.muted }}>
              Deleted by {b.deletedBy} {b.deletedAt && new Date(b.deletedAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
              {b.deleteReason ? ` — "${b.deleteReason}"` : ""}
            </p>
            {restoreBooking.isError && restoringId === b.id && (
              <p className="text-xs text-destructive mt-1">{(restoreBooking.error as Error).message}</p>
            )}
            <button
              onClick={() => {
                setRestoringId(b.id);
                restoreBooking.mutate(b.id);
              }}
              disabled={restoreBooking.isPending && restoringId === b.id}
              className="text-xs font-semibold mt-2 flex items-center gap-1"
              style={{ color: "var(--accent, #111111)" }}
            >
              <Undo2 size={11} /> {restoreBooking.isPending && restoringId === b.id ? "Restoring…" : "Restore"}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

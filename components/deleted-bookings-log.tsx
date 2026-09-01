"use client";

import { useState } from "react";
import { ChevronDown, Trash2, Undo2 } from "lucide-react";
import { Card } from "@/components/primitives";
import { useBookings, useDeletedBookings, useRestoreBooking } from "@/lib/queries/bookings";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import type { Booking } from "@/lib/types";

/**
 * Owner-only audit log of soft-deleted bookings (Architecture Decision 93).
 * Shows:
 * 1. Fully deleted entries (deletedAt set) — filtered to the active month
 * 2. Pending co-manager deletion requests (deleteRequestedAt set, deletedAt null)
 * Collapses when empty or when user clicks the header.
 */
export function DeletedBookingsLog({ activeMonth }: { activeMonth: string }) {
  const deletedBookingsQuery = useDeletedBookings();
  const bookingsQuery = useBookings();
  const restoreBooking = useRestoreBooking();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const allDeleted: Booking[] = deletedBookingsQuery.data ?? [];
  const allBookings: Booking[] = bookingsQuery.data ?? [];

  // Deleted entries for this month (deletedAt starts with "YYYY-MM")
  const monthDeleted = allDeleted.filter(
    (b) => b.deletedAt && b.deletedAt.startsWith(activeMonth)
  );

  // Pending co-manager requests (not yet approved/rejected)
  const pendingRequests = allBookings.filter(
    (b) => b.deleteRequestedAt && !b.deletedAt
  );

  const totalCount = monthDeleted.length + pendingRequests.length;

  if (deletedBookingsQuery.isLoading) return null;
  if (totalCount === 0) return null;

  return (
    <Card className="flex flex-col gap-0">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between w-full"
        style={{ paddingBottom: collapsed ? 0 : 12, marginBottom: collapsed ? 0 : 4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: C.muted }}>
          <Trash2 size={12} /> Deleted stays
          <span
            className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: C.bg, color: C.muted }}
          >
            {totalCount}
          </span>
        </p>
        <ChevronDown
          size={14}
          style={{ color: C.muted, transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2">
          {pendingRequests.map((b) => (
            <div key={b.id} className="p-3 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #F59E0B" }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{b.guest}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
                  Pending approval
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                {b.checkIn} → {b.checkOut}
              </p>
              <p className="text-xs mt-1.5" style={{ color: C.muted }}>
                Requested by {b.deleteRequestedBy}
                {b.deleteReason ? ` — "${b.deleteReason}"` : ""}
              </p>
            </div>
          ))}

          {[...monthDeleted].reverse().map((b) => (
            <div key={b.id} className="p-3 rounded-xl" style={{ background: C.bg }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{b.guest}</p>
                <p className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(b.amount, b.currency)}</p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                {b.checkIn} → {b.checkOut}
              </p>
              <p className="text-xs mt-1.5" style={{ color: C.muted }}>
                Deleted by {b.deletedBy}{" "}
                {b.deletedAt && new Date(b.deletedAt).toLocaleString(undefined, {
                  hour: "numeric", minute: "2-digit", month: "short", day: "numeric",
                })}
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
                <Undo2 size={11} />{" "}
                {restoreBooking.isPending && restoringId === b.id ? "Restoring…" : "Restore"}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

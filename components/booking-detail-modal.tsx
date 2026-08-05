"use client";

import { useState } from "react";
import { X, Check, Undo2, UtensilsCrossed, LogOut, Download, Loader2 } from "lucide-react";
import { Pill } from "@/components/primitives";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { nightsBetween } from "@/lib/periods";
import { BOOKING_SOURCE_LABEL, ISSUE_STATUS_TONE } from "@/lib/labels";
import { useOrders } from "@/lib/queries/orders";
import { buildGuestReceipt } from "@/lib/guest-receipt";
import type { Booking, Issue, Property, Room, Schedule } from "@/lib/types";
import { BookingFormRouter } from "./booking-form-router";
import { GuestOrderForm } from "./guest-order-form";
import type { BookingInput } from "@/lib/queries/bookings";

/**
 * context/07-mockup.jsx BookingDetailModal — the single canonical modal
 * for viewing a booking, reused across Day/Week/Month/Per Stay
 * (context/03-code-standards.md: "Do not create view-specific variants").
 */
export function BookingDetailModal({
  booking,
  schedules,
  issues,
  properties,
  rooms,
  showPropertyTag,
  onClose,
  onSubmitEdit,
  editIsPending,
  editError,
  onDelete,
  onConfirm,
  onUnconfirm,
  onCheckout,
  checkoutIsPending,
  canEdit,
}: {
  booking: Booking;
  schedules: Schedule[];
  issues: Issue[];
  properties: Property[];
  /** HOSTEL bookings only — used to show the room name against booking.roomId. */
  rooms?: Room[];
  showPropertyTag: boolean;
  onClose: () => void;
  /** `opts.onSuccess` fires only once the edit actually saves — the edit
   * form stays open on failure (e.g. a HOSTEL room-conflict rejection)
   * instead of closing unconditionally and swallowing the error. */
  onSubmitEdit: (id: string, input: BookingInput, opts: { onSuccess: () => void }) => void;
  editIsPending?: boolean;
  editError?: string | null;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onUnconfirm: (id: string) => void;
  /** HOSTEL bookings only — sets checkedOutAt server-side. */
  onCheckout?: (id: string) => void;
  checkoutIsPending?: boolean;
  canEdit: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const relatedShifts = schedules.filter((s) => s.date >= booking.checkIn && s.date <= booking.checkOut);
  const relatedIssues = issues.filter((i) => i.guest === booking.guest);
  const propertyColor = properties.find((p) => p.id === booking.propertyId)?.color ?? "var(--accent, #111111)";
  const room = booking.roomId ? rooms?.find((r) => r.id === booking.roomId) : undefined;
  const isHostelBooking = !!room;
  const ordersQuery = useOrders(booking.id, { enabled: isHostelBooking });
  const orders = ordersQuery.data ?? [];
  const foodTotal = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), 0);
  const propertyName = properties.find((p) => p.id === booking.propertyId)?.name ?? "";

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      const [{ pdf }, { GuestReceiptPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./guest-receipt-pdf-document"),
      ]);
      const data = buildGuestReceipt({ propertyName, booking, room: room ?? null, orders });
      const blob = await pdf(<GuestReceiptPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${propertyName} - ${booking.guest} - receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: "#fff", maxHeight: "85vh" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2">
              {showPropertyTag && <div className="w-2.5 h-2.5 rounded-full" style={{ background: propertyColor }} />}
              <p className="text-lg font-bold" style={{ color: C.text }}>
                {booking.guest}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: C.bg, color: C.text }}
                  >
                    Edit
                  </button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onDelete(booking.id);
                          onClose();
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: "var(--accent, #111111)", color: "#fff" }}
                      >
                        Confirm delete
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold" style={{ color: C.muted }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: C.bg, color: C.muted }}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
              <button onClick={onClose}>
                <X size={20} style={{ color: C.muted }} />
              </button>
            </div>
          </div>
          <div className="px-6 py-4 overflow-y-auto flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: C.bg }}>
                <p className="text-xs" style={{ color: C.muted }}>Check-in</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{booking.checkIn}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: C.bg }}>
                <p className="text-xs" style={{ color: C.muted }}>Check-out</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{booking.checkOut}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: C.bg }}>
                <p className="text-xs" style={{ color: C.muted }}>Nights</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{nights}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: C.bg }}>
                <p className="text-xs" style={{ color: C.muted }}>Amount</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{fmtCurrency(booking.amount, booking.currency)}</p>
              </div>
              {room && (
                <div className="p-3 rounded-xl" style={{ background: C.bg }}>
                  <p className="text-xs" style={{ color: C.muted }}>Room</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{room.name}</p>
                </div>
              )}
              {booking.passportNumber && (
                <div className="p-3 rounded-xl" style={{ background: C.bg }}>
                  <p className="text-xs" style={{ color: C.muted }}>Passport</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{booking.passportNumber}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="muted">{BOOKING_SOURCE_LABEL[booking.source]}</Pill>
              <Pill tone={booking.status === "CONFIRMED" ? "teal" : "amber"}>
                {booking.status === "CONFIRMED" ? "Confirmed" : "Expected"}
              </Pill>
            </div>
            {canEdit && booking.status === "EXPECTED" && (
              <button
                onClick={() => onConfirm(booking.id)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl"
                style={{ background: C.teal, color: "#fff" }}
              >
                <Check size={16} /> Confirm payment received
              </button>
            )}
            {canEdit && booking.status === "CONFIRMED" && (
              <button
                onClick={() => onUnconfirm(booking.id)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl"
                style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}
              >
                <Undo2 size={16} /> Mark as not yet paid
              </button>
            )}
            {isHostelBooking && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Food orders</p>
                  {canEdit && !booking.checkedOutAt && (
                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: "var(--accent, #111111)" }}
                    >
                      <UtensilsCrossed size={12} /> Order for guest
                    </button>
                  )}
                </div>
                {orders.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>No orders yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {orders.flatMap((o) => o.items).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                        <span className="text-sm" style={{ color: C.text }}>{item.quantity}× {item.name}</span>
                        <span className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(item.unitPrice * item.quantity, item.currency)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.tealSoft }}>
                      <span className="text-sm font-semibold" style={{ color: C.teal }}>Food total</span>
                      <span className="text-sm font-bold" style={{ color: C.teal }}>{fmtCurrency(foodTotal, booking.currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isHostelBooking && booking.checkedOutAt && (
              <Pill tone="muted">Checked out {booking.checkedOutAt.slice(0, 10)}</Pill>
            )}
            {isHostelBooking && !booking.checkedOutAt && canEdit && onCheckout && (
              confirmCheckout ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: C.muted }}>Check {booking.guest} out? Ordering will stop.</span>
                  <button
                    onClick={() => { onCheckout(booking.id); setConfirmCheckout(false); }}
                    disabled={checkoutIsPending}
                    className="text-xs font-semibold"
                    style={{ color: "var(--accent, #111111)" }}
                  >
                    Confirm
                  </button>
                  <button onClick={() => setConfirmCheckout(false)} className="text-xs font-semibold" style={{ color: C.muted }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCheckout(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl"
                  style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
                >
                  <LogOut size={16} /> Check guest out
                </button>
              )
            )}
            {isHostelBooking && booking.checkedOutAt && (
              <button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl"
                style={{ background: C.text, color: "#fff" }}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {isDownloading ? "Preparing…" : "Download receipt"}
              </button>
            )}
            {relatedShifts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
                  Schedules during this stay
                </p>
                <div className="flex flex-col gap-2">
                  {relatedShifts.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.tealSoft }}>
                      <p className="text-sm font-semibold" style={{ color: C.teal }}>{s.type} · {s.assignedTo}</p>
                      <span className="text-xs" style={{ color: C.muted }}>{s.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {relatedIssues.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
                  Issues linked to this guest
                </p>
                <div className="flex flex-col gap-2">
                  {relatedIssues.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{ background: i.status === "OPEN" ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.bg }}
                    >
                      <p className="text-sm" style={{ color: C.text }}>{i.description}</p>
                      {i.status && <Pill tone={ISSUE_STATUS_TONE[i.status]}>{i.status}</Pill>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showEditForm && (
        <BookingFormRouter
          booking={booking}
          onClose={() => setShowEditForm(false)}
          onSubmit={(input) =>
            onSubmitEdit(booking.id, input, {
              onSuccess: () => {
                setShowEditForm(false);
                onClose();
              },
            })
          }
          isPending={editIsPending}
          error={editError}
          properties={properties}
          defaultPropertyId={booking.propertyId}
        />
      )}
      {showOrderForm && (
        <GuestOrderForm bookingId={booking.id} guestName={booking.guest} onClose={() => setShowOrderForm(false)} />
      )}
    </>
  );
}

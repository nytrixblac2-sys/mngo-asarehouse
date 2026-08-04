"use client";

import { useState } from "react";
import { X, Check, Undo2 } from "lucide-react";
import { Pill } from "@/components/primitives";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { nightsBetween } from "@/lib/periods";
import { ISSUE_STATUS_TONE } from "@/lib/labels";
import type { Booking, Issue, Property, Schedule } from "@/lib/types";
import { BookingForm } from "./booking-form";
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
  showPropertyTag,
  onClose,
  onSubmitEdit,
  onDelete,
  onConfirm,
  onUnconfirm,
  canEdit,
}: {
  booking: Booking;
  schedules: Schedule[];
  issues: Issue[];
  properties: Property[];
  showPropertyTag: boolean;
  onClose: () => void;
  onSubmitEdit: (id: string, input: BookingInput) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onUnconfirm: (id: string) => void;
  canEdit: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const relatedShifts = schedules.filter((s) => s.date >= booking.checkIn && s.date <= booking.checkOut);
  const relatedIssues = issues.filter((i) => i.guest === booking.guest);
  const propertyColor = properties.find((p) => p.id === booking.propertyId)?.color ?? "var(--accent, #111111)";

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
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="muted">{booking.source === "AIRBNB" ? "Airbnb" : "Local / Cash"}</Pill>
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
        <BookingForm
          booking={booking}
          onClose={() => setShowEditForm(false)}
          onSubmit={(input) => {
            onSubmitEdit(booking.id, input);
            setShowEditForm(false);
            onClose();
          }}
          properties={properties}
          defaultPropertyId={booking.propertyId}
        />
      )}
    </>
  );
}

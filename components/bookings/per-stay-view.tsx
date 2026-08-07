"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink, ClipboardList, AlertTriangle, Check, Undo2 } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { BookingFormRouter } from "@/components/booking-form-router";
import { ShiftForm } from "@/components/shift-form";
import { useEffectiveUser } from "@/components/effective-user-context";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { nightsBetween } from "@/lib/periods";
import { ISSUE_STATUS_TONE } from "@/lib/labels";
import type { Booking, Issue, Property, Schedule, TeamMember } from "@/lib/types";
import type { BookingInput } from "@/lib/queries/bookings";
import type { ScheduleInput } from "@/lib/queries/schedules";

/** context/07-mockup.jsx PerStayView. */
export function PerStayView({
  bookings,
  schedules,
  issues,
  onSchedule,
  onLogIssue,
  onSubmitEditBooking,
  editBookingIsPending,
  editBookingError,
  onDeleteBooking,
  deleteBookingIsPending,
  deleteBookingError,
  onSubmitEditSchedule,
  onConfirmPayout,
  onUnconfirmPayout,
  onSelectBooking,
  properties,
  showPropertyTag,
  team,
  canEdit = true,
}: {
  bookings: Booking[];
  schedules: Schedule[];
  issues: Issue[];
  /** Accepts a full ISO date directly, not just a day-in-active-month
   * number — see the call sites below (Architecture Decision 60). */
  onSchedule: (dayOrDate: number | string) => void;
  onLogIssue: (dayOrDate: number | string, guest?: string) => void;
  onSubmitEditBooking: (id: string, input: BookingInput, opts: { onSuccess: () => void }) => void;
  editBookingIsPending?: boolean;
  editBookingError?: string | null;
  /** Requires a reason; requires the workspace PIN too unless the actor is
   * the ACCOUNT_OWNER — see BookingDetailModal's identical rule
   * (Architecture Decision 93). */
  onDeleteBooking: (id: string, reason: string, pin?: string) => void;
  deleteBookingIsPending?: boolean;
  deleteBookingError?: string | null;
  onSubmitEditSchedule: (id: string, input: ScheduleInput) => void;
  onConfirmPayout: (id: string) => void;
  onUnconfirmPayout: (id: string) => void;
  onSelectBooking: (booking: Booking) => void;
  properties: Property[];
  showPropertyTag: boolean;
  team: TeamMember[];
  canEdit?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletePin, setDeletePin] = useState("");
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const { effectiveUser } = useEffectiveUser();
  const isOwner = effectiveUser.role === "ACCOUNT_OWNER";

  const handleDeleteBooking = (id: string) => {
    if (!deleteReason.trim() || (!isOwner && deletePin.trim().length === 0)) return;
    onDeleteBooking(id, deleteReason.trim(), isOwner ? undefined : deletePin.trim());
  };
  const cancelDelete = () => {
    setConfirmDeleteId(null);
    setDeleteReason("");
    setDeletePin("");
  };

  const sorted = [...bookings].sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 && (
        <Card>
          <p className="text-sm" style={{ color: C.muted }}>No stays this month.</p>
        </Card>
      )}
      {sorted.map((b) => {
        const nights = nightsBetween(b.checkIn, b.checkOut);
        const isExpanded = expandedId === b.id;
        const relatedSchedules = schedules.filter((s) => s.date >= b.checkIn && s.date <= b.checkOut);
        const relatedIssues = issues.filter((i) => i.guest === b.guest);
        const hasOpenIssue = relatedIssues.some((i) => i.status === "OPEN" || i.status === "IN_PROGRESS");

        return (
          <Card key={b.id} style={{ border: hasOpenIssue ? "1px solid rgba(255,90,95,0.3)" : undefined }}>
            <button onClick={() => setExpandedId(isExpanded ? null : b.id)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {showPropertyTag && (
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: properties.find((p) => p.id === b.propertyId)?.color ?? "var(--accent, #111111)" }}
                  />
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{b.guest}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {b.checkIn} → {b.checkOut} · {nights} night{nights !== 1 ? "s" : ""} · {b.source === "AIRBNB" ? "Airbnb" : "Local"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {hasOpenIssue && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent, #111111)" }} />}
                <span className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(b.amount, b.currency)}</span>
                <Pill tone={b.status === "CONFIRMED" ? "teal" : "amber"}>{b.status === "CONFIRMED" ? "Confirmed" : "Expected"}</Pill>
                <ChevronRight size={14} style={{ color: C.muted, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </div>
            </button>

            {isExpanded && (
              <div className="mt-4 flex flex-col gap-4" style={{ paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => onSelectBooking(b)} className="flex items-center gap-2 w-fit">
                  <p className="text-sm font-semibold" style={{ color: "var(--accent, #111111)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    {b.guest}
                  </p>
                  <ExternalLink size={13} style={{ color: "var(--accent, #111111)" }} />
                </button>
                {canEdit && (
                  <>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => onSchedule(b.checkIn)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                      style={{ background: C.teal, color: "#fff" }}
                    >
                      <ClipboardList size={12} /> Add schedule
                    </button>
                    <button
                      onClick={() => onLogIssue(b.checkIn, b.guest)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                      style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" }}
                    >
                      <AlertTriangle size={12} /> Log issue
                    </button>
                    <button
                      onClick={() => setEditingBooking(b)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                      style={{ background: C.bg, color: C.text }}
                    >
                      Edit stay
                    </button>
                    {b.status === "EXPECTED" ? (
                      <button
                        onClick={() => onConfirmPayout(b.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                        style={{ background: C.tealSoft, color: C.teal }}
                      >
                        <Check size={12} /> Confirm payment
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnconfirmPayout(b.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                        style={{ background: C.bg, color: C.muted }}
                        title="Payment hasn't actually been received? Undo the confirmation."
                      >
                        <Undo2 size={12} /> Mark unpaid
                      </button>
                    )}
                    {confirmDeleteId !== b.id && (
                      <button
                        onClick={() => setConfirmDeleteId(b.id)}
                        className="text-xs font-semibold px-3 py-2 rounded-full"
                        style={{ background: C.bg, color: C.muted }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {confirmDeleteId === b.id && (
                    <div className="mt-2 pt-2 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
                      <p className="text-xs" style={{ color: C.muted }}>
                        {isOwner ? "Type a reason to delete this stay." : "Ask the owner for the PIN, and type why you're deleting this stay."}
                      </p>
                      {!isOwner && (
                        <input
                          value={deletePin}
                          onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ""))}
                          type="password"
                          inputMode="numeric"
                          placeholder="Owner PIN"
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ border: `1px solid ${C.border}` }}
                        />
                      )}
                      <input
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Reason (e.g. duplicate entry)"
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ border: `1px solid ${C.border}` }}
                      />
                      {deleteBookingError && <p className="text-xs text-destructive">{deleteBookingError}</p>}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          disabled={deleteBookingIsPending || !deleteReason.trim() || (!isOwner && deletePin.trim().length === 0)}
                          className="text-xs font-semibold"
                          style={{ color: "var(--accent, #111111)" }}
                        >
                          {deleteBookingIsPending ? "Deleting…" : "Confirm delete"}
                        </button>
                        <button onClick={cancelDelete} className="text-xs font-semibold" style={{ color: C.muted }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}

                {relatedSchedules.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
                      Schedules during this stay
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {relatedSchedules.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.tealSoft }}>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: C.teal }}>{s.type} · {s.assignedTo}</p>
                            {s.note && <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{s.note}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: C.muted }}>{s.date}</span>
                            {canEdit && (
                              <button onClick={() => setEditingSchedule(s)} className="text-xs font-semibold" style={{ color: C.teal }}>
                                Edit
                              </button>
                            )}
                          </div>
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
                    <div className="flex flex-col gap-1.5">
                      {relatedIssues.map((i) => (
                        <div
                          key={i.id}
                          className="flex items-center justify-between py-1.5 px-3 rounded-xl"
                          style={{ background: i.status === "OPEN" ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.bg }}
                        >
                          <p className="text-xs" style={{ color: C.text }}>{i.description}</p>
                          {i.status && <Pill tone={ISSUE_STATUS_TONE[i.status]}>{i.status}</Pill>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
      {editingBooking && (
        <BookingFormRouter
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSubmit={(input) =>
            onSubmitEditBooking(editingBooking.id, input, { onSuccess: () => setEditingBooking(null) })
          }
          isPending={editBookingIsPending}
          error={editBookingError}
          properties={properties}
          defaultPropertyId={editingBooking.propertyId}
        />
      )}
      {editingSchedule && (
        <ShiftForm
          date={editingSchedule.date}
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSubmit={(input) => {
            onSubmitEditSchedule(editingSchedule.id, input);
            setEditingSchedule(null);
          }}
          properties={properties}
          defaultPropertyId={editingSchedule.propertyId}
          team={team}
        />
      )}
    </div>
  );
}

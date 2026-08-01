import { ClipboardList, AlertTriangle } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { ISSUE_STATUS_LABEL, ISSUE_STATUS_TONE, ISSUE_TYPE_LABEL, SCHEDULE_TYPE_LABEL } from "@/lib/labels";
import { bookingCoversDay, dayOfMonth, MONTH_NAMES } from "@/lib/calendar";
import type { Booking, Issue, Property, Schedule } from "@/lib/types";

/** context/07-mockup.jsx DaySummaryPanel — the shared "what's happening
 * on this day" card used by Day, Week, and Month views. */
export function DaySummaryPanel({
  day,
  bookings,
  schedules,
  issues,
  onSchedule,
  onLogIssue,
  onToggleIssue,
  onSelectBooking,
  properties,
  showPropertyTag,
  width = 260,
  canEdit = true,
  activeMonth,
}: {
  day: number | null;
  bookings: Booking[];
  schedules: Schedule[];
  issues: Issue[];
  onSchedule: (day: number) => void;
  onLogIssue: (day: number) => void;
  onToggleIssue: (issue: Issue) => void;
  onSelectBooking: (booking: Booking) => void;
  properties: Property[];
  showPropertyTag: boolean;
  width?: number | string;
  canEdit?: boolean;
  activeMonth: { year: number; month: number };
}) {
  if (!day) {
    return (
      <Card style={{ width }}>
        <p className="text-sm" style={{ color: C.muted }}>
          Click a date to see what&apos;s happening that day.
        </p>
      </Card>
    );
  }

  const mnLabel = `${MONTH_NAMES[activeMonth.month]} ${day}, ${activeMonth.year}`;
  const dayBookings = bookings.filter(
    (b) => bookingCoversDay(b, day) || dayOfMonth(b.checkIn) === day || dayOfMonth(b.checkOut) === day
  );
  const dayShifts = schedules.filter((s) => dayOfMonth(s.date) === day);
  const dayIssues = issues.filter((i) => dayOfMonth(i.date) === day);

  return (
    <Card style={{ width }}>
      <p className="text-sm font-bold mb-3" style={{ color: C.text }}>
        {mnLabel}
      </p>
      {dayBookings.length === 0 && dayShifts.length === 0 && dayIssues.length === 0 && (
        <p className="text-sm mb-4" style={{ color: C.muted }}>
          Nothing happening this day.
        </p>
      )}
      {dayBookings.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {dayBookings.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBooking(b)}
              className="w-full text-left p-2.5 rounded-xl"
              style={{ background: C.bg }}
            >
              <div className="flex items-center gap-2">
                {showPropertyTag && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: properties.find((p) => p.id === b.propertyId)?.color ?? "var(--accent, #111111)" }}
                  />
                )}
                <p className="text-xs font-semibold" style={{ color: C.text }}>
                  {b.guest}
                </p>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                {fmtCurrency(b.amount, b.currency)}
              </p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {dayOfMonth(b.checkIn) === day && <Pill tone="accent">Check-in</Pill>}
                {dayOfMonth(b.checkOut) === day && <Pill tone="muted">Check-out</Pill>}
              </div>
            </button>
          ))}
        </div>
      )}
      {dayShifts.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {dayShifts.map((s) => (
            <div key={s.id} className="p-2.5 rounded-xl" style={{ background: C.tealSoft }}>
              <p className="text-xs font-semibold" style={{ color: C.teal }}>
                {SCHEDULE_TYPE_LABEL[s.type]} · {s.assignedTo}
              </p>
              {s.note && (
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                  {s.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {dayIssues.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {dayIssues.map((i) => {
            const canToggle = canEdit && i.status !== null;
            const Tag = canToggle ? "button" : "div";
            return (
              <Tag
                key={i.id}
                onClick={canToggle ? () => onToggleIssue(i) : undefined}
                className="w-full text-left p-2.5 rounded-xl"
                style={{ background: i.status === "OPEN" ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.tealSoft }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: i.status === "OPEN" ? "var(--accent, #111111)" : C.teal }}
                  >
                    {ISSUE_TYPE_LABEL[i.type]}
                  </p>
                  {i.status && <Pill tone={ISSUE_STATUS_TONE[i.status]}>{ISSUE_STATUS_LABEL[i.status]}</Pill>}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                  {i.description}
                </p>
              </Tag>
            );
          })}
        </div>
      )}
      {canEdit && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSchedule(day)}
            className="w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
            style={{ background: C.teal, color: "#fff" }}
          >
            <ClipboardList size={13} /> Schedule for this day
          </button>
          <button
            onClick={() => onLogIssue(day)}
            className="w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
            style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" }}
          >
            <AlertTriangle size={13} /> Log issue
          </button>
        </div>
      )}
    </Card>
  );
}

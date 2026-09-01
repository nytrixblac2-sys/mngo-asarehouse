import { Card } from "@/components/primitives";
import { DaySummaryPanel } from "@/components/day-summary-panel";
import { C } from "@/lib/colors";
import { WEEKDAY_NAMES, bookingChecksInOn, bookingChecksOutOn, bookingCoversDay, isToday, type ActiveMonth } from "@/lib/calendar";
import type { Booking, Issue, Property, Schedule } from "@/lib/types";

/** context/07-mockup.jsx MonthView. */
export function MonthView({
  bookings,
  schedules,
  issues,
  selectedDay,
  setSelectedDay,
  onSchedule,
  onLogIssue,
  onToggleIssue,
  onSelectBooking,
  properties,
  showPropertyTag,
  canEdit = true,
  activeMonth,
}: {
  bookings: Booking[];
  schedules: Schedule[];
  issues: Issue[];
  selectedDay: number | null;
  setSelectedDay: (day: number) => void;
  onSchedule: (day: number) => void;
  onLogIssue: (day: number) => void;
  onToggleIssue: (issue: Issue) => void;
  onSelectBooking: (booking: Booking) => void;
  properties: Property[];
  showPropertyTag: boolean;
  canEdit?: boolean;
  activeMonth: ActiveMonth;
}) {
  const { year, month, daysInMonth } = activeMonth;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstWeekdayOffset = new Date(year, month, 1).getDay();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start">
      <Card className="flex-1 overflow-x-auto">
        <div style={{ minWidth: 280 }}>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_NAMES.map((d) => (
            <div key={d} className="text-xs font-semibold text-center py-1" style={{ color: C.muted }}>
              {d.slice(0, 2)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekdayOffset }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            // Check-in and check-out get their own fixed dot colors
            // (not property-dependent) so a stay's start/end day is
            // visually obvious — user request 2026-08-04: checkout days
            // previously had no indicator at all. The mid-stay dot (a
            // continuing night, not the check-in day itself) keeps the
            // original property/accent color.
            const checkInBooking = bookings.find((b) => bookingChecksInOn(b, activeMonth, day));
            const checkOutBooking = bookings.find((b) => bookingChecksOutOn(b, activeMonth, day));
            const midStayBooking = bookings.find(
              (b) => bookingCoversDay(b, activeMonth, day) && !bookingChecksInOn(b, activeMonth, day)
            );
            const hasAny = Boolean(checkInBooking || checkOutBooking || midStayBooking);
            const isSelected = selectedDay === day;
            const isCurrentDay = isToday(activeMonth, day);
            const midStayColor = midStayBooking
              ? showPropertyTag
                ? properties.find((p) => p.id === midStayBooking.propertyId)?.color ?? "var(--accent, #111111)"
                : "var(--accent, #111111)"
              : null;
            // Background tint prioritizes check-in, then an ongoing stay,
            // then check-out — arbitrary priority, just needs one color
            // for the cell wash while the dots below carry the full detail.
            const tintColor = checkInBooking ? C.tealLight : midStayColor ?? (checkOutBooking ? C.redLight : null);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative p-1"
                style={{
                  background: hasAny ? `${tintColor}18` : C.bg,
                  border: isSelected ? `2px solid ${C.text}` : isCurrentDay ? `2px solid ${C.teal}` : "1px solid transparent",
                }}
              >
                <span style={{ color: hasAny ? tintColor ?? undefined : C.text, fontWeight: hasAny ? 700 : 500 }}>{day}</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  {checkInBooking && <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.tealLight }} />}
                  {midStayBooking && <div className="w-1.5 h-1.5 rounded-full" style={{ background: midStayColor ?? undefined }} />}
                  {checkOutBooking && <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.redLight }} />}
                </div>
              </button>
            );
          })}
        </div>
        </div>{/* end minWidth wrapper */}
      </Card>
      <DaySummaryPanel
        day={selectedDay}
        bookings={bookings}
        schedules={schedules}
        issues={issues}
        onSchedule={onSchedule}
        onLogIssue={onLogIssue}
        onToggleIssue={onToggleIssue}
        onSelectBooking={onSelectBooking}
        properties={properties}
        showPropertyTag={showPropertyTag}
        canEdit={canEdit}
        activeMonth={activeMonth}
      />
    </div>
  );
}

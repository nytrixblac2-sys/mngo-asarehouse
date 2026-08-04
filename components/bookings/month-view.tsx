import { Card } from "@/components/primitives";
import { DaySummaryPanel } from "@/components/day-summary-panel";
import { C } from "@/lib/colors";
import { WEEKDAY_NAMES, bookingCoversDay, isToday, type ActiveMonth } from "@/lib/calendar";
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
    <div className="flex gap-4 items-start">
      <Card className="flex-1">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_NAMES.map((d) => (
            <div key={d} className="text-xs font-semibold text-center py-1" style={{ color: C.muted }}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekdayOffset }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const booking = bookings.find((b) => bookingCoversDay(b, activeMonth, day));
            const isSelected = selectedDay === day;
            const isCurrentDay = isToday(activeMonth, day);
            const dotColor = booking
              ? showPropertyTag
                ? properties.find((p) => p.id === booking.propertyId)?.color ?? "var(--accent, #111111)"
                : "var(--accent, #111111)"
              : null;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative p-1"
                style={{
                  background: booking ? `${dotColor}18` : C.bg,
                  border: isSelected ? `2px solid ${C.text}` : isCurrentDay ? `2px solid ${C.teal}` : "1px solid transparent",
                }}
              >
                <span style={{ color: booking ? dotColor ?? undefined : C.text, fontWeight: booking ? 700 : 500 }}>{day}</span>
                {booking && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: dotColor ?? undefined }} />}
              </button>
            );
          })}
        </div>
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

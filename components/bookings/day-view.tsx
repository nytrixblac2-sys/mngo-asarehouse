import { ChevronLeft, ChevronRight } from "lucide-react";
import { DaySummaryPanel } from "@/components/day-summary-panel";
import { C } from "@/lib/colors";
import { WEEKDAY_NAMES, bookingChecksInOn, bookingChecksOutOn, bookingCoversDay, dayOfMonth, isToday, type ActiveMonth } from "@/lib/calendar";
import type { Booking, Issue, Property, Schedule } from "@/lib/types";

/** context/07-mockup.jsx DayView — horizontal day strip. */
export function DayView({
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
  selectedDay: number;
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
  const currentDay = selectedDay || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedDay(Math.max(1, currentDay - 1))}
          className="p-2 rounded-full flex-shrink-0"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <ChevronLeft size={16} style={{ color: C.text }} />
        </button>
        <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {days.map((day) => {
            // Check-in/check-out get their own fixed colors, prioritized
            // over a plain mid-stay indicator — user request 2026-08-04:
            // checkout days previously showed no dot at all, since
            // bookingCoversDay deliberately excludes the checkout day
            // itself (see lib/calendar.ts).
            const isCheckIn = bookings.some((b) => bookingChecksInOn(b, activeMonth, day));
            const isCheckOut = bookings.some((b) => bookingChecksOutOn(b, activeMonth, day));
            const hasBooking = bookings.some((b) => bookingCoversDay(b, activeMonth, day));
            const hasIssue = issues.some((i) => dayOfMonth(i.date) === day);
            const hasShift = schedules.some((s) => dayOfMonth(s.date) === day);
            const isSelected = currentDay === day;
            const isCurrentDay = isToday(activeMonth, day);
            const dotColor = isCheckIn
              ? C.tealLight
              : isCheckOut
                ? C.redLight
                : hasBooking
                  ? "var(--accent, #111111)"
                  : hasShift
                    ? C.teal
                    : hasIssue
                      ? "var(--accent, #111111)"
                      : null;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl"
                style={{
                  background: isSelected ? C.text : C.bg,
                  border: isSelected ? "none" : isCurrentDay ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                  minWidth: 44,
                }}
              >
                <span className="text-[10px] font-medium" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : C.muted }}>
                  {WEEKDAY_NAMES[new Date(year, month, day).getDay()]}
                </span>
                <span className="text-sm font-bold" style={{ color: isSelected ? "#fff" : C.text }}>{day}</span>
                {dotColor && !isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />}
                {!dotColor && !isSelected && <div className="w-1.5 h-1.5" />}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setSelectedDay(Math.min(daysInMonth, currentDay + 1))}
          className="p-2 rounded-full flex-shrink-0"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <ChevronRight size={16} style={{ color: C.text }} />
        </button>
      </div>

      <DaySummaryPanel
        day={currentDay}
        bookings={bookings}
        schedules={schedules}
        issues={issues}
        onSchedule={onSchedule}
        onLogIssue={onLogIssue}
        onToggleIssue={onToggleIssue}
        onSelectBooking={onSelectBooking}
        properties={properties}
        showPropertyTag={showPropertyTag}
        width="100%"
        canEdit={canEdit}
        activeMonth={activeMonth}
      />
    </div>
  );
}

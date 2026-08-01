import { ChevronLeft, ChevronRight, AlertTriangle, Plus } from "lucide-react";
import { Card } from "@/components/primitives";
import { DaySummaryPanel } from "@/components/day-summary-panel";
import { C } from "@/lib/colors";
import { ISSUE_TYPE_LABEL, SCHEDULE_TYPE_LABEL } from "@/lib/labels";
import { WEEKDAY_NAMES, bookingCoversDay, dayOfMonth, type ActiveMonth } from "@/lib/calendar";
import type { Booking, Issue, Property, Schedule } from "@/lib/types";

/** context/07-mockup.jsx WeekView. */
export function WeekView({
  bookings,
  schedules,
  issues,
  weekStart,
  setWeekStart,
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
  weekStart: number;
  setWeekStart: (day: number) => void;
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
  const { year, month, daysInMonth, monthShort } = activeMonth;
  const days = Array.from({ length: 7 }, (_, i) => weekStart + i).filter((d) => d >= 1 && d <= daysInMonth);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(Math.max(1, weekStart - 7))}
          className="p-2 rounded-full"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <ChevronLeft size={16} style={{ color: C.text }} />
        </button>
        <p className="text-sm font-semibold" style={{ color: C.text }}>
          {monthShort} {days[0]} – {days[days.length - 1]}, {year}
        </p>
        <button
          onClick={() => setWeekStart(Math.min(daysInMonth - 6, weekStart + 7))}
          className="p-2 rounded-full"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <ChevronRight size={16} style={{ color: C.text }} />
        </button>
      </div>
      <Card>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const covering = bookings.filter((b) => bookingCoversDay(b, day) || dayOfMonth(b.checkIn) === day);
            const shiftsToday = schedules.filter((s) => dayOfMonth(s.date) === day);
            const issuesToday = issues.filter((i) => dayOfMonth(i.date) === day);
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="text-left rounded-xl p-2 min-h-32 flex flex-col"
                style={{ background: C.bg, border: isSelected ? `2px solid ${C.text}` : `1px solid ${C.border}` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold" style={{ color: C.text }}>
                    {WEEKDAY_NAMES[new Date(year, month, day).getDay()]} {day}
                  </p>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <span
                        onClick={(e) => { e.stopPropagation(); onLogIssue(day); }}
                        className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" }}
                      >
                        <AlertTriangle size={9} />
                      </span>
                      <span
                        onClick={(e) => { e.stopPropagation(); onSchedule(day); }}
                        className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: C.tealSoft, color: C.teal }}
                      >
                        <Plus size={10} />
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {covering.map((b) => (
                    <div
                      key={b.id}
                      className="text-[10px] font-semibold px-1.5 py-1 rounded-md truncate"
                      style={{
                        background: showPropertyTag
                          ? `${properties.find((p) => p.id === b.propertyId)?.color ?? "var(--accent, #111111)"}22`
                          : "var(--accent-soft, rgba(0,0,0,0.07))",
                        color: showPropertyTag
                          ? properties.find((p) => p.id === b.propertyId)?.color ?? "var(--accent, #111111)"
                          : "var(--accent, #111111)",
                      }}
                    >
                      {b.guest.split(" ")[0]}
                    </div>
                  ))}
                  {shiftsToday.map((s) => (
                    <div key={s.id} className="text-[10px] font-semibold px-1.5 py-1 rounded-md truncate" style={{ background: C.tealSoft, color: C.teal }}>
                      {SCHEDULE_TYPE_LABEL[s.type]}
                    </div>
                  ))}
                  {issuesToday.map((i) => (
                    <div
                      key={i.id}
                      className="text-[10px] font-semibold px-1.5 py-1 rounded-md truncate"
                      style={{
                        background: i.status === "OPEN" ? "var(--accent-soft, rgba(0,0,0,0.07))" : "#F2F2F2",
                        color: i.status === "OPEN" ? "var(--accent, #111111)" : C.muted,
                      }}
                    >
                      {ISSUE_TYPE_LABEL[i.type]}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
      {selectedDay && days.includes(selectedDay) && (
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
          width="100%"
          canEdit={canEdit}
          activeMonth={activeMonth}
        />
      )}
    </div>
  );
}

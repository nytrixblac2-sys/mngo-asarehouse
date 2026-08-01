"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, ClipboardList, Upload } from "lucide-react";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useAppStore } from "@/store/use-app-store";
import { useBookings, useConfirmBookingPayout, useCreateBooking, useDeleteBooking, useUpdateBooking } from "@/lib/queries/bookings";
import { useCreateSchedule, useSchedules, useUpdateSchedule } from "@/lib/queries/schedules";
import { useCreateIssue, useIssues, useSetIssueStatus } from "@/lib/queries/issues";
import { useProperties } from "@/lib/queries/properties";
import { useTeam } from "@/lib/queries/team";
import { C } from "@/lib/colors";
import { MONTH_NAMES, pad2 } from "@/lib/calendar";
import type { Booking, Issue } from "@/lib/types";
import { DayView } from "@/components/bookings/day-view";
import { WeekView } from "@/components/bookings/week-view";
import { MonthView } from "@/components/bookings/month-view";
import { PerStayView } from "@/components/bookings/per-stay-view";
import { BookingForm } from "@/components/booking-form";
import { ShiftForm } from "@/components/shift-form";
import { IssueForm } from "@/components/issue-form";
import { BookingDetailModal } from "@/components/booking-detail-modal";
import { EmptyPropertyState } from "@/components/empty-property-state";
import { CsvImportModal } from "@/components/csv-import-modal";

type ViewKey = "Day" | "Week" | "Month" | "Per stay";
const VIEWS: ViewKey[] = ["Day", "Week", "Month", "Per stay"];

/** context/07-mockup.jsx BookingsView. */
export default function BookingsPage() {
  const { effectiveCanEdit } = useEffectiveUser();
  const activePropertyId = useAppStore((s) => s.activePropertyId);

  const [view, setView] = useState<ViewKey>("Month");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(1);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [shiftFormDate, setShiftFormDate] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState<{ date: string; guest: string | null } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const today = new Date();
  const [bYear, setBYear] = useState(today.getFullYear());
  const [bMonth, setBMonth] = useState(today.getMonth());

  const bookingsQuery = useBookings();
  const schedulesQuery = useSchedules();
  const issuesQuery = useIssues();
  const propertiesQuery = useProperties();
  const teamQuery = useTeam();

  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();
  const confirmPayout = useConfirmBookingPayout();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const createIssue = useCreateIssue();
  const setIssueStatus = useSetIssueStatus();

  const isLoading =
    bookingsQuery.isLoading || schedulesQuery.isLoading || issuesQuery.isLoading || propertiesQuery.isLoading;
  const isError = bookingsQuery.isError || schedulesQuery.isError || issuesQuery.isError || propertiesQuery.isError;

  const properties = (propertiesQuery.data ?? []).filter(
    (p) => activePropertyId === "all" || p.id === activePropertyId
  );
  const showPropertyTag = (propertiesQuery.data?.length ?? 0) > 1;
  const team = teamQuery.data ?? [];

  const daysInMonth = new Date(bYear, bMonth + 1, 0).getDate();
  const monthPrefix = `${bYear}-${pad2(bMonth + 1)}`;
  const monthLabel = `${MONTH_NAMES[bMonth]} ${bYear}`;
  const monthShort = MONTH_NAMES[bMonth].slice(0, 3);
  const activeMonth = { year: bYear, month: bMonth, daysInMonth, monthPrefix, monthLabel, monthShort };

  const withActiveProperty = <T extends { propertyId: string }>(rows: T[] | undefined): T[] =>
    (rows ?? []).filter((r) => activePropertyId === "all" || r.propertyId === activePropertyId);

  const monthBookings = withActiveProperty(bookingsQuery.data).filter(
    (b) => b.checkIn.startsWith(monthPrefix) || b.checkOut.startsWith(monthPrefix)
  );
  const monthShifts = withActiveProperty(schedulesQuery.data).filter((s) => s.date.startsWith(monthPrefix));
  const monthIssues = withActiveProperty(issuesQuery.data).filter((i) => i.date.startsWith(monthPrefix));

  const goToPrevMonth = () => {
    if (bMonth === 0) { setBYear((y) => y - 1); setBMonth(11); }
    else setBMonth((m) => m - 1);
    setSelectedDay(null);
    setWeekStart(1);
  };
  const goToNextMonth = () => {
    if (bMonth === 11) { setBYear((y) => y + 1); setBMonth(0); }
    else setBMonth((m) => m + 1);
    setSelectedDay(null);
    setWeekStart(1);
  };

  const openSchedule = (day: number) => setShiftFormDate(`${monthPrefix}-${pad2(day)}`);
  const openIssue = (day: number, guest?: string) => setIssueForm({ date: `${monthPrefix}-${pad2(day)}`, guest: guest ?? null });
  const handleToggleIssue = (issue: Issue) => {
    if (!issue.status) return;
    setIssueStatus.mutate({ id: issue.id, status: issue.status === "OPEN" ? "RESOLVED" : "OPEN" });
  };

  const defaultPropertyId = activePropertyId !== "all" ? activePropertyId : propertiesQuery.data?.[0]?.id ?? "";

  if (isLoading) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">Something went wrong loading bookings.</p>;
  }
  if ((propertiesQuery.data?.length ?? 0) === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Bookings</h1>
        <EmptyPropertyState canEdit={effectiveCanEdit} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>Bookings</h1>
          <div className="flex items-center gap-1 mt-1">
            <button onClick={goToPrevMonth} className="p-1 rounded-full" style={{ color: C.muted }}>
              <ChevronLeft size={14} />
            </button>
            <p className="text-sm font-semibold" style={{ color: C.muted }}>{monthLabel}</p>
            <button onClick={goToNextMonth} className="p-1 rounded-full" style={{ color: C.muted }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        {effectiveCanEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openIssue(1)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" }}
            >
              <AlertTriangle size={16} /> Log issue
            </button>
            <button
              onClick={() => setShiftFormDate(`${monthPrefix}-01`)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: C.tealSoft, color: C.teal }}
            >
              <ClipboardList size={16} /> Add schedule
            </button>
            <button
              onClick={() => setShowCsvImport(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
            >
              <Upload size={16} /> Import CSV
            </button>
            <button
              onClick={() => setShowBookingForm(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: "var(--accent, #111111)", color: "#fff" }}
            >
              <Plus size={16} /> New booking
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: "#F2F2F2" }}>
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: view === v ? "#fff" : "transparent", color: view === v ? C.text : C.muted }}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "Day" && (
        <DayView
          bookings={monthBookings} schedules={monthShifts} issues={monthIssues}
          selectedDay={selectedDay || 1} setSelectedDay={setSelectedDay}
          onSchedule={openSchedule} onLogIssue={openIssue} onToggleIssue={handleToggleIssue}
          onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag}
          canEdit={effectiveCanEdit} activeMonth={activeMonth}
        />
      )}
      {view === "Week" && (
        <WeekView
          bookings={monthBookings} schedules={monthShifts} issues={monthIssues}
          weekStart={weekStart} setWeekStart={setWeekStart} selectedDay={selectedDay} setSelectedDay={setSelectedDay}
          onSchedule={openSchedule} onLogIssue={openIssue} onToggleIssue={handleToggleIssue}
          onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag}
          canEdit={effectiveCanEdit} activeMonth={activeMonth}
        />
      )}
      {view === "Month" && (
        <MonthView
          bookings={monthBookings} schedules={monthShifts} issues={monthIssues}
          selectedDay={selectedDay} setSelectedDay={setSelectedDay}
          onSchedule={openSchedule} onLogIssue={openIssue} onToggleIssue={handleToggleIssue}
          onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag}
          canEdit={effectiveCanEdit} activeMonth={activeMonth}
        />
      )}
      {view === "Per stay" && (
        <PerStayView
          bookings={monthBookings} schedules={monthShifts} issues={monthIssues}
          onSchedule={openSchedule} onLogIssue={openIssue}
          onSubmitEditBooking={(id, input) => updateBooking.mutate({ id, input })}
          onDeleteBooking={(id) => deleteBooking.mutate(id)}
          onSubmitEditSchedule={(id, input) => updateSchedule.mutate({ id, input })}
          onConfirmPayout={(id) => confirmPayout.mutate(id)}
          onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag}
          team={team} canEdit={effectiveCanEdit}
        />
      )}

      {effectiveCanEdit && showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          properties={propertiesQuery.data ?? []}
          defaultPropertyId={defaultPropertyId}
        />
      )}
      {effectiveCanEdit && showBookingForm && (
        <BookingForm
          onClose={() => setShowBookingForm(false)}
          onSubmit={(input) => { createBooking.mutate(input); setShowBookingForm(false); }}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
        />
      )}
      {effectiveCanEdit && shiftFormDate && (
        <ShiftForm
          date={shiftFormDate}
          onClose={() => setShiftFormDate(null)}
          onSubmit={(input) => { createSchedule.mutate(input); setShiftFormDate(null); }}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          team={team}
        />
      )}
      {effectiveCanEdit && issueForm && (
        <IssueForm
          date={issueForm.date}
          defaultGuest={issueForm.guest}
          bookings={monthBookings}
          onClose={() => setIssueForm(null)}
          onSubmit={(input) => { createIssue.mutate(input); setIssueForm(null); }}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
        />
      )}
      {selectedBooking && (() => {
        const liveBooking = bookingsQuery.data?.find((b) => b.id === selectedBooking.id) ?? selectedBooking;
        return (
          <BookingDetailModal
            booking={liveBooking}
            schedules={schedulesQuery.data ?? []}
            issues={issuesQuery.data ?? []}
            properties={propertiesQuery.data ?? []}
            showPropertyTag={showPropertyTag}
            onClose={() => setSelectedBooking(null)}
            onSubmitEdit={(id, input) => updateBooking.mutate({ id, input })}
            onDelete={(id) => deleteBooking.mutate(id)}
            onConfirm={(id) => confirmPayout.mutate(id)}
            canEdit={effectiveCanEdit}
          />
        );
      })()}
    </div>
  );
}

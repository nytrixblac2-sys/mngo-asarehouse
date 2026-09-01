"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useAppStore } from "@/store/use-app-store";
import { useBookings } from "@/lib/queries/bookings";
import { useCreateIssue, useIssues, useSetIssueStatus } from "@/lib/queries/issues";
import { useCreateSchedule, useSchedules, useSetScheduleStatus, useUpdateSchedule } from "@/lib/queries/schedules";
import { useProperties } from "@/lib/queries/properties";
import { useTeam } from "@/lib/queries/team";
import { C } from "@/lib/colors";
import { ISSUE_STATUS_LABEL, ISSUE_STATUS_TONE, ISSUE_TYPE_LABEL, SCHEDULE_TYPE_LABEL } from "@/lib/labels";
import type { IssueStatus, Schedule } from "@/lib/types";
import { IssueForm } from "@/components/issue-form";
import { ShiftForm } from "@/components/shift-form";
import { EmptyPropertyState } from "@/components/empty-property-state";

const STATUS_FILTER_OPTIONS: Array<IssueStatus | "all"> = ["all", "OPEN", "IN_PROGRESS", "RESOLVED"];
const STATUS_OPTIONS: IssueStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

function statusButtonColor(s: IssueStatus): string {
  if (s === "OPEN") return "var(--accent, #111111)";
  if (s === "IN_PROGRESS") return "#F59E0B";
  return C.teal;
}

/** Reads Dashboard's `?issueId=` deep-link to pre-select the matching card. */
function useDeepLinkIssueId() {
  return useSearchParams().get("issueId");
}

/** context/07-mockup.jsx IssuesView. */
function IssuesAndSchedules() {
  const { effectiveCanEdit } = useEffectiveUser();
  const activePropertyId = useAppStore((s) => s.activePropertyId);
  const deepLinkIssueId = useDeepLinkIssueId();

  const _now = new Date();
  const [issueYear, setIssueYear] = useState(_now.getFullYear());
  const [issueMonth, setIssueMonth] = useState(_now.getMonth());

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthPrefix = `${issueYear}-${String(issueMonth + 1).padStart(2, "0")}`;
  const monthLabel = `${MONTH_NAMES[issueMonth]} ${issueYear}`;

  const goPrevMonth = () => {
    if (issueMonth === 0) { setIssueYear((y) => y - 1); setIssueMonth(11); }
    else setIssueMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (issueMonth === 11) { setIssueYear((y) => y + 1); setIssueMonth(0); }
    else setIssueMonth((m) => m + 1);
  };

  const [tab, setTab] = useState<"issues" | "schedules">("issues");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(deepLinkIssueId);
  const [issueNoteDraft, setIssueNoteDraft] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [scheduleNoteDraft, setScheduleNoteDraft] = useState("");
  const [filterStatus, setFilterStatus] = useState<IssueStatus | "all">("all");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const issuesQuery = useIssues();
  const schedulesQuery = useSchedules();
  const bookingsQuery = useBookings();
  const propertiesQuery = useProperties();
  const teamQuery = useTeam();

  const createIssue = useCreateIssue();
  const setIssueStatus = useSetIssueStatus();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const setScheduleStatus = useSetScheduleStatus();

  const selectIssue = (id: string) => {
    setSelectedIssueId((prev) => (prev === id ? null : id));
    setIssueNoteDraft("");
  };
  const selectSchedule = (id: string) => {
    setSelectedScheduleId((prev) => (prev === id ? null : id));
    setScheduleNoteDraft("");
  };

  const isLoading =
    issuesQuery.isLoading || schedulesQuery.isLoading || bookingsQuery.isLoading || propertiesQuery.isLoading;
  const isError = issuesQuery.isError || schedulesQuery.isError || bookingsQuery.isError || propertiesQuery.isError;

  const properties = (propertiesQuery.data ?? []).filter(
    (p) => activePropertyId === "all" || p.id === activePropertyId
  );
  const showPropertyTag = (propertiesQuery.data?.length ?? 0) > 1;
  const team = teamQuery.data ?? [];

  const withActiveProperty = <T extends { propertyId: string }>(rows: T[] | undefined): T[] =>
    (rows ?? []).filter((r) => activePropertyId === "all" || r.propertyId === activePropertyId);

  const issues = withActiveProperty(issuesQuery.data);
  const schedules = withActiveProperty(schedulesQuery.data);
  const bookings = withActiveProperty(bookingsQuery.data);

  const monthIssues = issues.filter((i) => i.date.startsWith(monthPrefix));
  const monthSchedules = schedules.filter((s) => s.date.startsWith(monthPrefix));

  const filteredIssues = monthIssues
    .filter((i) => filterStatus === "all" || i.status === filterStatus)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const sortedSchedules = [...monthSchedules].sort((a, b) => (a.date < b.date ? -1 : 1));

  const defaultPropertyId = activePropertyId !== "all" ? activePropertyId : propertiesQuery.data?.[0]?.id ?? "";
  const today = new Date().toISOString().slice(0, 10);

  if (isLoading) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">Something went wrong loading issues & schedules.</p>;
  }
  if ((propertiesQuery.data?.length ?? 0) === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Issues &amp; Schedules</h1>
        <EmptyPropertyState canEdit={effectiveCanEdit} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Issues &amp; Schedules</h1>
        {effectiveCanEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowIssueForm(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" }}
            >
              <AlertTriangle size={16} /> Log issue
            </button>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: C.teal, color: "#fff" }}
            >
              <ClipboardList size={16} /> Add schedule
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={goPrevMonth} className="p-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold min-w-[90px] text-center" style={{ color: C.text }}>{monthLabel}</span>
        <button onClick={goNextMonth} className="p-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: "#F2F2F2" }}>
        {(["issues", "schedules"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full capitalize"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? C.text : C.muted }}
          >
            {t === "issues" ? "Issues" : "Schedules"}
          </button>
        ))}
      </div>

      {tab === "issues" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: filterStatus === s ? C.text : C.bg, color: filterStatus === s ? "#fff" : C.muted, border: `1px solid ${C.border}` }}
              >
                {s === "all" ? "All" : ISSUE_STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {filteredIssues.length === 0 && (
              <Card>
                <p className="text-sm" style={{ color: C.muted }}>
                  No issues {filterStatus !== "all" ? `with status "${ISSUE_STATUS_LABEL[filterStatus]}"` : `logged in ${monthLabel}`}.
                </p>
              </Card>
            )}
            {filteredIssues.map((i) => {
              const isSelected = selectedIssueId === i.id;
              return (
                <Card
                  key={i.id}
                  style={{ cursor: "pointer", border: isSelected ? `2px solid ${C.text}` : undefined }}
                >
                  <div
                    className="flex items-start justify-between"
                    onClick={() => selectIssue(i.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill tone={i.status ? ISSUE_STATUS_TONE[i.status] : "muted"}>
                          {i.status ? ISSUE_STATUS_LABEL[i.status] : "Note"}
                        </Pill>
                        <p className="text-sm font-semibold" style={{ color: C.text }}>{ISSUE_TYPE_LABEL[i.type]}</p>
                      </div>
                      <p className="text-sm" style={{ color: C.muted }}>{i.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {i.guest && <span className="text-xs" style={{ color: C.muted }}>Guest: {i.guest}</span>}
                        <span className="text-xs" style={{ color: C.muted }}>{i.date}</span>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      style={{ color: C.muted, transform: isSelected ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
                    />
                  </div>

                  {isSelected && effectiveCanEdit && i.status !== null && (
                    <div className="mt-4 pt-4 flex flex-col gap-4" style={{ borderTop: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Change status</p>
                        <textarea
                          value={issueNoteDraft}
                          onChange={(e) => setIssueNoteDraft(e.target.value)}
                          placeholder="Note (optional) — what happened?"
                          rows={2}
                          className="w-full mb-2 px-3 py-2 rounded-xl text-sm"
                          style={{ border: `1px solid ${C.border}` }}
                        />
                        <div className="flex gap-2 flex-wrap">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setIssueStatus.mutate({ id: i.id, status: s, note: issueNoteDraft.trim() || undefined });
                                setIssueNoteDraft("");
                              }}
                              className="text-xs font-semibold px-3 py-2 rounded-full"
                              style={{
                                background: i.status === s ? statusButtonColor(s) : C.bg,
                                color: i.status === s ? "#fff" : C.text,
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              {ISSUE_STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                      {i.statusHistory.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Status history</p>
                          <div className="flex flex-col gap-0">
                            {[...i.statusHistory].reverse().map((h, idx) => (
                              <div key={idx} className="flex items-start gap-3 pb-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: statusButtonColor(h.status) }} />
                                  {idx < i.statusHistory.length - 1 && (
                                    <div className="w-px mt-1" style={{ background: C.border, minHeight: 16 }} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: C.text }}>{ISSUE_STATUS_LABEL[h.status]}</p>
                                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{new Date(h.at).toLocaleString()}</p>
                                  {h.note && <p className="text-xs mt-1" style={{ color: C.text }}>{h.note}</p>}
                                </div>
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
          </div>
        </>
      )}

      {tab === "schedules" && (
        <div className="flex flex-col gap-3">
          {sortedSchedules.length === 0 && (
            <Card><p className="text-sm" style={{ color: C.muted }}>No schedules in {monthLabel}.</p></Card>
          )}
          {sortedSchedules.map((s) => {
            const isSelected = selectedScheduleId === s.id;
            return (
              <Card
                key={s.id}
                style={{ cursor: "pointer", border: isSelected ? `2px solid ${C.text}` : undefined }}
              >
                <div className="flex items-center justify-between" onClick={() => selectSchedule(s.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill tone={ISSUE_STATUS_TONE[s.status]}>{ISSUE_STATUS_LABEL[s.status]}</Pill>
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{SCHEDULE_TYPE_LABEL[s.type]}</p>
                    </div>
                    <p className="text-xs" style={{ color: C.muted }}>
                      {s.assignedTo}{s.note ? ` · ${s.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold" style={{ color: C.teal }}>{s.date}</span>
                    {showPropertyTag && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: properties.find((p) => p.id === s.propertyId)?.color ?? "var(--accent, #111111)" }}
                      />
                    )}
                    {effectiveCanEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSchedule(s); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: C.bg, color: C.text }}
                      >
                        Edit
                      </button>
                    )}
                    <ChevronRight
                      size={14}
                      style={{ color: C.muted, transform: isSelected ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
                    />
                  </div>
                </div>

                {isSelected && effectiveCanEdit && (
                  <div className="mt-4 pt-4 flex flex-col gap-4" style={{ borderTop: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Change status</p>
                      <textarea
                        value={scheduleNoteDraft}
                        onChange={(e) => setScheduleNoteDraft(e.target.value)}
                        placeholder="Note (optional) — how did it go?"
                        rows={2}
                        className="w-full mb-2 px-3 py-2 rounded-xl text-sm"
                        style={{ border: `1px solid ${C.border}` }}
                      />
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              setScheduleStatus.mutate({ id: s.id, status: st, note: scheduleNoteDraft.trim() || undefined });
                              setScheduleNoteDraft("");
                            }}
                            className="text-xs font-semibold px-3 py-2 rounded-full"
                            style={{
                              background: s.status === st ? statusButtonColor(st) : C.bg,
                              color: s.status === st ? "#fff" : C.text,
                              border: `1px solid ${C.border}`,
                            }}
                          >
                            {ISSUE_STATUS_LABEL[st]}
                          </button>
                        ))}
                      </div>
                    </div>
                    {s.statusHistory.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Status history</p>
                        <div className="flex flex-col gap-0">
                          {[...s.statusHistory].reverse().map((h, idx) => (
                            <div key={idx} className="flex items-start gap-3 pb-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: statusButtonColor(h.status) }} />
                                {idx < s.statusHistory.length - 1 && (
                                  <div className="w-px mt-1" style={{ background: C.border, minHeight: 16 }} />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: C.text }}>{ISSUE_STATUS_LABEL[h.status]}</p>
                                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{new Date(h.at).toLocaleString()}</p>
                                {h.note && <p className="text-xs mt-1" style={{ color: C.text }}>{h.note}</p>}
                              </div>
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
        </div>
      )}

      {effectiveCanEdit && showIssueForm && (
        <IssueForm
          date={today}
          bookings={bookings}
          onClose={() => setShowIssueForm(false)}
          onSubmit={(input) => { createIssue.mutate(input); setShowIssueForm(false); }}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
        />
      )}
      {effectiveCanEdit && showScheduleForm && (
        <ShiftForm
          date={today}
          onClose={() => setShowScheduleForm(false)}
          onSubmit={(input) => { createSchedule.mutate(input); setShowScheduleForm(false); }}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          team={team}
        />
      )}
      {effectiveCanEdit && editingSchedule && (
        <ShiftForm
          date={editingSchedule.date}
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSubmit={(input) => { updateSchedule.mutate({ id: editingSchedule.id, input }); setEditingSchedule(null); }}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          team={team}
        />
      )}
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={<p className="text-sm" style={{ color: C.muted }}>Loading…</p>}>
      <IssuesAndSchedules />
    </Suspense>
  );
}

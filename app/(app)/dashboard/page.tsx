"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, Pill } from "@/components/primitives";
import { CurrencyToggle } from "@/components/currency-toggle";
import { DeltaStat } from "@/components/delta-stat";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useAppStore } from "@/store/use-app-store";
import { useApproveBookingDeletion, useBookings, useConfirmBookingPayout, useRejectBookingDeletion, useUnconfirmBookingPayout } from "@/lib/queries/bookings";
import { useApproveOrderDeletion, useOrders, useRejectOrderDeletion } from "@/lib/queries/orders";
import { useExpenses } from "@/lib/queries/expenses";
import { useSchedules } from "@/lib/queries/schedules";
import { useIssues } from "@/lib/queries/issues";
import { useProperties } from "@/lib/queries/properties";
import { useWorkspace } from "@/lib/queries/workspace";
import { C } from "@/lib/colors";
import { applyMomo, confirmedBookings } from "@/lib/financials";
import { fmtCurrency, fmtGHS, fmtEUR } from "@/lib/format";
import { ISSUE_TYPE_LABEL, ISSUE_STATUS_LABEL, ISSUE_STATUS_TONE, SCHEDULE_TYPE_LABEL } from "@/lib/labels";
import { getPeriodPair, inRange, nightsBetween, type PeriodKey } from "@/lib/periods";
import type { Booking, Currency } from "@/lib/types";

const PERIOD_KEYS: PeriodKey[] = ["Week", "Month", "Year"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Real bug, 2026-08-12: the greeting was hardcoded "Good afternoon" no
 * matter the actual time — the user caught it reading "Good afternoon" at
 * 12am. Boundaries match how people actually describe time of day, not
 * just morning/afternoon/evening — a 1am greeting shouldn't say
 * "evening" either. Uses the browser's local hour (client component), so
 * this always reflects whoever's actually looking at the screen. */
function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function withPropertyFilter<T extends { propertyId: string }>(
  rows: T[] | undefined,
  activePropertyId: string
): T[] {
  return (rows ?? []).filter((r) => activePropertyId === "all" || r.propertyId === activePropertyId);
}

/**
 * context/07-mockup.jsx Dashboard. The Open issues banner deep-links to
 * /issues?issueId=... instead of opening an inline modal, matching what
 * context/01-project-overview.md actually specifies ("Deep-link from
 * Dashboard open issues banner → Issues & Schedules page with card
 * auto-expanded") rather than the mockup's inline-modal shortcut.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { effectiveUser, effectiveCanEdit } = useEffectiveUser();
  const activePropertyId = useAppStore((s) => s.activePropertyId);
  // Persisted across refresh — same reasoning as Bookings/Financials
  // (Architecture Decision 69).
  const { periodKey, chartCurrency } = useAppStore((s) => s.dashboardView);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const setPeriodKey = (k: PeriodKey) => setDashboardView({ periodKey: k });
  const setChartCurrency = (c: Currency) => setDashboardView({ chartCurrency: c });

  const isOwner = effectiveUser.role === "ACCOUNT_OWNER";
  const workspace = useWorkspace().data;

  const bookingsQuery = useBookings();
  const expensesQuery = useExpenses();
  const schedulesQuery = useSchedules();
  const issuesQuery = useIssues();
  const propertiesQuery = useProperties();
  // Only fetched for the owner, and only where orders even exist — same
  // enabled-gating pattern used elsewhere (Architecture Decision 99's
  // pending-approvals banner needs order deletion requests too, not just
  // booking ones).
  const ordersQuery = useOrders(undefined, { enabled: isOwner && workspace?.type === "HOSTEL" });
  const confirmPayout = useConfirmBookingPayout();
  const unconfirmPayout = useUnconfirmBookingPayout();
  const approveBookingDeletion = useApproveBookingDeletion();
  const rejectBookingDeletion = useRejectBookingDeletion();
  const approveOrderDeletion = useApproveOrderDeletion();
  const rejectOrderDeletion = useRejectOrderDeletion();

  const isLoading =
    bookingsQuery.isLoading || expensesQuery.isLoading || schedulesQuery.isLoading || issuesQuery.isLoading;
  const isError = bookingsQuery.isError || expensesQuery.isError || schedulesQuery.isError || issuesQuery.isError;

  const showPropertyTag = (propertiesQuery.data?.length ?? 0) > 1;
  const bookings = withPropertyFilter(bookingsQuery.data, activePropertyId);
  const expenses = withPropertyFilter(expensesQuery.data, activePropertyId);
  const schedules = withPropertyFilter(schedulesQuery.data, activePropertyId);
  const issues = withPropertyFilter(issuesQuery.data, activePropertyId);

  const today = todayISO();
  const openIssues = issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS");
  // Owner-only pending delete requests (Architecture Decision 99) — a
  // CO_MANAGER's delete no longer needs a shared PIN, it becomes a
  // request here instead. Order requests are cross-referenced against
  // this same property-filtered bookings list so the banner respects the
  // active property switcher automatically, without orders having their
  // own propertyId to filter by directly.
  const pendingBookingRequests = isOwner ? bookings.filter((b) => b.deleteRequestedAt) : [];
  const pendingOrderRequests = isOwner
    ? (ordersQuery.data ?? []).filter((o) => o.deleteRequestedAt && bookings.some((b) => b.id === o.bookingId))
    : [];
  const upcomingStays = [...bookings]
    .filter((b) => b.checkOut >= today)
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1))
    .slice(0, 5);
  const upcomingShifts = [...schedules]
    .filter((s) => s.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 5);

  const period = useMemo(() => getPeriodPair(periodKey), [periodKey]);

  // Chart is single-currency at a time, switchable via chartCurrency —
  // never mixed into one total, per context/02-architecture-context.md
  // invariant #2. User request 2026-08-04: was hardcoded to GHS only.
  const currentExpenses = expenses
    .filter((e) => e.currency === chartCurrency && inRange(e.date, period.current))
    .reduce((s, e) => s + applyMomo(e.amount, e.currency), 0);
  const previousExpenses = expenses
    .filter((e) => e.currency === chartCurrency && inRange(e.date, period.previous))
    .reduce((s, e) => s + applyMomo(e.amount, e.currency), 0);
  const chartData = [
    { label: period.previous.label, expenses: Math.round(previousExpenses) },
    { label: period.current.label, expenses: Math.round(currentExpenses) },
  ];

  const currentBookings = bookings.filter((b) => inRange(b.checkIn, period.current));
  const previousBookings = bookings.filter((b) => inRange(b.checkIn, period.previous));
  const currentShifts = schedules.filter((s) => inRange(s.date, period.current)).length;
  const previousShifts = schedules.filter((s) => inRange(s.date, period.previous)).length;

  // Income is cash-basis: which bookings were *confirmed* (paidAt) in this
  // period, not which ones the guest stayed during (checkIn) — a booking
  // whose stay falls in this period but hasn't been paid yet contributes
  // nothing here (see Architecture Decision 89). Deliberately a separate
  // filter from currentBookings/previousBookings above, which stay
  // checkIn-based since occupancy/booking-count are genuinely about the
  // stay, not the money.
  const confirmedInWorkspace = confirmedBookings(bookings);
  const currentIncomeBookings = confirmedInWorkspace.filter((b) => inRange(b.paidAt!, period.current));
  const previousIncomeBookings = confirmedInWorkspace.filter((b) => inRange(b.paidAt!, period.previous));
  const sumByCurrency = (list: Booking[], currency: Currency) =>
    list.filter((b) => b.currency === currency).reduce((s, b) => s + b.amount, 0);
  const currentIncomeGHS = sumByCurrency(currentIncomeBookings, "GHS");
  const previousIncomeGHS = sumByCurrency(previousIncomeBookings, "GHS");
  const currentIncomeEUR = sumByCurrency(currentIncomeBookings, "EUR");
  const previousIncomeEUR = sumByCurrency(previousIncomeBookings, "EUR");

  const nightsBooked = (list: Booking[]) => list.reduce((s, b) => s + nightsBetween(b.checkIn, b.checkOut), 0);
  const currentOccupancy = Math.min(100, Math.round((nightsBooked(currentBookings) / period.current.days) * 100));
  const previousOccupancy = Math.min(100, Math.round((nightsBooked(previousBookings) / period.previous.days) * 100));

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <p className="text-sm" style={{ color: C.muted }}>
        Loading…
      </p>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Something went wrong loading the dashboard.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>
          {timeOfDayGreeting()}, {effectiveUser.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          {dateLabel} — here&apos;s where things stand.
        </p>
      </div>

      {openIssues.length > 0 && (
        <Card style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", border: "1px solid rgba(255,90,95,0.2)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--accent, #111111)" }}>
            Open issues ({openIssues.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {openIssues.map((i) => (
              <button
                key={i.id}
                onClick={() => router.push(`/issues?issueId=${i.id}`)}
                className="w-full text-left flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.6)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>
                    {ISSUE_TYPE_LABEL[i.type]}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {i.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {/* Non-null: openIssues is already filtered to OPEN | IN_PROGRESS. */}
                  <Pill tone={ISSUE_STATUS_TONE[i.status!]}>{ISSUE_STATUS_LABEL[i.status!]}</Pill>
                  <ChevronRight size={14} style={{ color: C.muted }} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isOwner && (pendingBookingRequests.length > 0 || pendingOrderRequests.length > 0) && (
        <Card style={{ background: "#FFFBEB", border: "1px solid #F59E0B" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#92400E" }}>
            Pending delete requests ({pendingBookingRequests.length + pendingOrderRequests.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {pendingBookingRequests.map((b) => (
              <div
                key={b.id}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.6)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>Stay — {b.guest}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    Requested by {b.deleteRequestedBy}{b.deleteReason ? ` — "${b.deleteReason}"` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <button
                    onClick={() => approveBookingDeletion.mutate(b.id)}
                    className="text-xs font-semibold"
                    style={{ color: "#92400E" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectBookingDeletion.mutate(b.id)}
                    className="text-xs font-semibold"
                    style={{ color: C.muted }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingOrderRequests.map((o) => {
              const guest = bookings.find((b) => b.id === o.bookingId)?.guest ?? "Unknown guest";
              const itemSummary = o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
              return (
                <div
                  key={o.id}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.6)" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>Order — {guest}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{itemSummary}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                      Requested by {o.deleteRequestedBy}{o.deleteReason ? ` — "${o.deleteReason}"` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <button
                      onClick={() => approveOrderDeletion.mutate(o.id)}
                      className="text-xs font-semibold"
                      style={{ color: "#92400E" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectOrderDeletion.mutate(o.id)}
                      className="text-xs font-semibold"
                      style={{ color: C.muted }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card style={{ background: C.tealSoft, border: "1px solid rgba(0,166,153,0.2)" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: C.teal }}>
          Upcoming schedules
        </p>
        <div className="flex flex-col gap-1.5">
          {upcomingShifts.length === 0 && (
            <p className="text-sm" style={{ color: C.muted }}>
              No schedules yet.
            </p>
          )}
          {upcomingShifts.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-2 px-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.6)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: C.text }}>
                  {SCHEDULE_TYPE_LABEL[s.type]}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {s.assignedTo}
                  {s.note ? ` · ${s.note}` : ""}
                </p>
              </div>
              <span className="text-xs font-semibold flex-shrink-0 ml-3" style={{ color: C.teal }}>
                {s.date}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>
          Upcoming stays
        </p>
        <div className="flex flex-col divide-y" style={{ borderColor: C.border }}>
          {upcomingStays.length === 0 && (
            <p className="text-sm" style={{ color: C.muted }}>
              Nothing coming up.
            </p>
          )}
          {upcomingStays.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                {showPropertyTag && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        propertiesQuery.data?.find((p) => p.id === b.propertyId)?.color ?? "var(--accent, #111111)",
                    }}
                  />
                )}
                <div>
                  <p className="text-sm font-medium" style={{ color: C.text }}>
                    {b.guest}
                  </p>
                  <p className="text-xs" style={{ color: C.muted }}>
                    {b.checkIn} → {b.checkOut}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: C.text }}>
                  {fmtCurrency(b.amount, b.currency)}
                </span>
                {b.status === "EXPECTED" ? (
                  effectiveCanEdit ? (
                    <button
                      onClick={() => confirmPayout.mutate(b.id)}
                      disabled={confirmPayout.isPending}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: C.teal, color: "#fff", opacity: confirmPayout.isPending ? 0.6 : 1 }}
                    >
                      <Check size={13} /> Confirm payout
                    </button>
                  ) : (
                    <Pill tone="amber">Expected</Pill>
                  )
                ) : effectiveCanEdit ? (
                  <div className="flex items-center gap-2">
                    <Pill tone="teal">Confirmed</Pill>
                    <button
                      onClick={() => unconfirmPayout.mutate(b.id)}
                      disabled={unconfirmPayout.isPending}
                      className="text-xs font-semibold"
                      style={{ color: C.muted, opacity: unconfirmPayout.isPending ? 0.6 : 1 }}
                      title="Payment hasn't actually been received? Undo the confirmation."
                    >
                      Mark unpaid
                    </button>
                  </div>
                ) : (
                  <Pill tone="teal">Confirmed</Pill>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold" style={{ color: C.text }}>
            {period.current.label} vs {period.previous.label}
          </p>
          <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "#F2F2F2" }}>
            {PERIOD_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => setPeriodKey(k)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: periodKey === k ? "#fff" : "transparent", color: periodKey === k ? C.text : C.muted }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: C.muted }}>
            Expenses ({chartCurrency === "EUR" ? "€" : "GH₵"})
          </p>
          <CurrencyToggle value={chartCurrency} onChange={setChartCurrency} currencies={["GHS", "EUR"]} />
        </div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(v) => fmtCurrency(Number(v), chartCurrency)}
                contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 12 }}
              />
              <Bar dataKey="expenses" fill="var(--accent, #111111)" radius={[6, 6, 0, 0]} barSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <DeltaStat label="Occupancy" current={currentOccupancy} previous={previousOccupancy} format={(n) => `${n}%`} />
          <DeltaStat label="Bookings" current={currentBookings.length} previous={previousBookings.length} />
          <DeltaStat label="Schedules" current={currentShifts} previous={previousShifts} />
          <DeltaStat label="Income (GHS)" current={currentIncomeGHS} previous={previousIncomeGHS} format={fmtGHS} />
          <DeltaStat label="Income (EUR)" current={currentIncomeEUR} previous={previousIncomeEUR} format={fmtEUR} />
        </div>
      </Card>
    </div>
  );
}

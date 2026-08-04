"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { CurrencyToggle } from "@/components/currency-toggle";
import { SubToggle } from "@/components/sub-toggle";
import { AddIncomeForm } from "@/components/add-income-form";
import { ExpenseForm } from "@/components/expense-form";
import { GenerateReportModal } from "@/components/generate-report-modal";
import { EmptyPropertyState } from "@/components/empty-property-state";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useAppStore } from "@/store/use-app-store";
import { useBookings } from "@/lib/queries/bookings";
import { useCreateExpense, useExpenses } from "@/lib/queries/expenses";
import { useCreateManualIncome, useManualIncome } from "@/lib/queries/manual-income";
import { useProperties } from "@/lib/queries/properties";
import { useTeam } from "@/lib/queries/team";
import { useWorkspace } from "@/lib/queries/workspace";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { applyMomo, computeManagementReport, computeOwnersReport, sumConfirmedIncome } from "@/lib/financials";
import { EXPENSE_CATEGORY_LABEL, EXPENSE_CATEGORY_TONE } from "@/lib/labels";
import { MONTH_NAMES, pad2 } from "@/lib/calendar";
import type { Allocation, Currency, PrevBalance } from "@/lib/types";

const DEFAULT_ALLOCATION: Allocation = { owners: 60, operations: 15, management: 25 };

/** context/07-mockup.jsx FinancialsView, with dynamic month navigation
 * (real current month, any year/month reachable) replacing the mockup's
 * fixed 3-month MONTH_PREFIXES array. */
export default function FinancialsPage() {
  const { effectiveCanEdit } = useEffectiveUser();
  const activePropertyId = useAppStore((s) => s.activePropertyId);

  // Persisted across refresh — same reasoning as Bookings (Architecture
  // Decision 69): refreshing while viewing a past/future month, a
  // non-default tab, or a non-default currency all used to bounce back to
  // this page's hardcoded defaults.
  const {
    year: fYear, month: fMonth, tab, ownerCurrency, oakCurrency, ownerSub, oakcoSub,
  } = useAppStore((s) => s.financialsView);
  const setFinancialsView = useAppStore((s) => s.setFinancialsView);
  const setTab = (t: "owner" | "oakco") => setFinancialsView({ tab: t });
  const setOwnerCurrency = (c: Currency) => setFinancialsView({ ownerCurrency: c });
  const setOakCurrency = (c: Currency) => setFinancialsView({ oakCurrency: c });
  const setOwnerSub = (s: "income" | "expenses") => setFinancialsView({ ownerSub: s });
  const setOakcoSub = (s: "income" | "expenses") => setFinancialsView({ oakcoSub: s });

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const bookingsQuery = useBookings();
  const expensesQuery = useExpenses();
  const manualIncomeQuery = useManualIncome();
  const propertiesQuery = useProperties();
  const teamQuery = useTeam();
  const workspaceQuery = useWorkspace();

  const createExpense = useCreateExpense();
  const createManualIncome = useCreateManualIncome();

  const isLoading =
    bookingsQuery.isLoading || expensesQuery.isLoading || manualIncomeQuery.isLoading || propertiesQuery.isLoading;
  const isError =
    bookingsQuery.isError || expensesQuery.isError || manualIncomeQuery.isError || propertiesQuery.isError;

  if (isLoading) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">Something went wrong loading financials.</p>;
  }

  const properties = propertiesQuery.data ?? [];
  // Financials is always scoped to one property (different allocation/currencies/prevBalance
  // per property) — falls back to the first when "All properties" is selected, matching
  // context/07-mockup.jsx: `properties.find(p => p.id === selectedPropertyId) || properties[0]`.
  const activeProperty = properties.find((p) => p.id === activePropertyId) ?? properties[0];

  if (!activeProperty) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Financials</h1>
        <EmptyPropertyState canEdit={effectiveCanEdit} />
      </div>
    );
  }

  const propCurrencies: Currency[] = activeProperty.currencies.length > 0 ? activeProperty.currencies : ["GHS"];
  const propAlloc = activeProperty.allocation;
  const team = teamQuery.data ?? [];
  const workspaceName = workspaceQuery.data?.name;
  const managementLabel = workspaceName ?? "Management";

  const ownerCur: Currency = propCurrencies.includes(ownerCurrency) ? ownerCurrency : propCurrencies[0];
  const oakCur: Currency = propCurrencies.includes(oakCurrency) ? oakCurrency : propCurrencies[0];

  const monthPrefix = `${fYear}-${pad2(fMonth + 1)}`;
  const monthLabel = `${MONTH_NAMES[fMonth]} ${fYear}`;

  const propertyBookings = (bookingsQuery.data ?? []).filter((b) => b.propertyId === activeProperty.id);
  const propertyExpenses = (expensesQuery.data ?? []).filter((e) => e.propertyId === activeProperty.id);
  const propertyManualIncome = (manualIncomeQuery.data ?? []).filter((m) => m.propertyId === activeProperty.id);

  const monthBookingsOwner = propertyBookings.filter((b) => b.checkIn.startsWith(monthPrefix) && b.currency === ownerCur);
  const monthBookingsOak = propertyBookings.filter((b) => b.checkIn.startsWith(monthPrefix) && b.currency === oakCur);
  const monthExpensesOwner = propertyExpenses.filter((e) => e.date.startsWith(monthPrefix) && e.currency === ownerCur);
  const monthExpensesOak = propertyExpenses.filter((e) => e.date.startsWith(monthPrefix) && e.currency === oakCur);
  const monthManualIncome = propertyManualIncome.filter((m) => m.date.startsWith(monthPrefix) && m.currency === ownerCur);

  const allocOwner: Allocation = propAlloc[ownerCur] ?? DEFAULT_ALLOCATION;
  const allocOak: Allocation = propAlloc[oakCur] ?? DEFAULT_ALLOCATION;
  const prevBalanceOwner: PrevBalance = ownerCur === "GHS" ? activeProperty.prevBalanceGhs : activeProperty.prevBalanceEur;
  const prevBalanceOak: PrevBalance = oakCur === "GHS" ? activeProperty.prevBalanceGhs : activeProperty.prevBalanceEur;

  const ownerReport = computeOwnersReport({
    confirmedIncome: sumConfirmedIncome(monthBookingsOwner),
    allocation: allocOwner,
    monthExpenses: monthExpensesOwner,
    manualIncome: monthManualIncome,
    prevBalance: prevBalanceOwner,
  });
  const ownerLineItems = monthExpensesOwner
    .filter((e) => e.category === "OWNERS" || e.category === "OPERATIONS")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const ownerIncomeRows = monthBookingsOwner.map((b) => ({
    booking: b,
    ownersAmt: b.amount * (allocOwner.owners / 100),
    opsAmt: b.amount * (allocOwner.operations / 100),
  }));

  const oakReport = computeManagementReport({
    confirmedIncome: sumConfirmedIncome(monthBookingsOak),
    allocation: allocOak,
    monthExpenses: monthExpensesOak,
    prevBalance: prevBalanceOak,
  });
  const oakExpItems = monthExpensesOak.filter((e) => e.category === "MANAGEMENT").sort((a, b) => (a.date < b.date ? 1 : -1));
  const oakIncomeRows = monthBookingsOak.map((b) => ({ booking: b, amt: b.amount * (allocOak.management / 100) }));

  const goToPrevMonth = () => {
    setFinancialsView(fMonth === 0 ? { year: fYear - 1, month: 11 } : { year: fYear, month: fMonth - 1 });
  };
  const goToNextMonth = () => {
    setFinancialsView(fMonth === 11 ? { year: fYear + 1, month: 0 } : { year: fYear, month: fMonth + 1 });
  };

  const defaultPropertyId = activeProperty.id;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Financials</h1>
        <div className="flex items-center gap-2">
          {effectiveCanEdit && (
            <button
              onClick={() => setShowIncomeForm(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: C.teal, color: "#fff" }}
            >
              <Plus size={16} /> Add income
            </button>
          )}
          {effectiveCanEdit && (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{ background: "var(--accent, #111111)", color: "#fff" }}
            >
              <Plus size={16} /> Add expense
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={goToPrevMonth} className="p-2 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <ChevronLeft size={16} style={{ color: C.text }} />
        </button>
        <span className="text-sm font-semibold w-32 text-center" style={{ color: C.text }}>{monthLabel}</span>
        <button onClick={goToNextMonth} className="p-2 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <ChevronRight size={16} style={{ color: C.text }} />
        </button>
        {effectiveCanEdit && (
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full ml-2"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
          >
            <FileText size={16} /> Generate report
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: "#F2F2F2" }}>
        <button
          onClick={() => setTab("owner")}
          className="text-xs font-semibold px-4 py-2 rounded-full"
          style={{ background: tab === "owner" ? "#fff" : "transparent", color: tab === "owner" ? C.text : C.muted }}
        >
          Owner Report
        </button>
        {effectiveCanEdit && (
          <button
            onClick={() => setTab("oakco")}
            className="text-xs font-semibold px-4 py-2 rounded-full"
            style={{ background: tab === "oakco" ? "#fff" : "transparent", color: tab === "oakco" ? C.text : C.muted }}
          >
            {managementLabel} · Internal
          </button>
        )}
      </div>

      {tab === "owner" && (
        <>
          <CurrencyToggle value={ownerCur} onChange={setOwnerCurrency} currencies={propCurrencies} />

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Owners Fund — {allocOwner.owners}%</p>
              <p className="text-2xl font-bold mt-2" style={{ color: C.text }}>{fmtCurrency(ownerReport.ownersAlloc, ownerCur)}</p>
              <div className="flex items-center justify-between text-sm mt-3" style={{ color: C.muted }}><span>Expenses</span><span>-{fmtCurrency(ownerReport.ownersExp, ownerCur)}</span></div>
              <div className="flex items-center justify-between text-sm font-semibold mt-1" style={{ color: "var(--accent, #111111)" }}><span>Balance</span><span>{fmtCurrency(ownerReport.ownersBalance, ownerCur)}</span></div>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Operations Fund — {allocOwner.operations}%</p>
              <p className="text-2xl font-bold mt-2" style={{ color: C.text }}>{fmtCurrency(ownerReport.opsAlloc, ownerCur)}</p>
              <div className="flex items-center justify-between text-sm mt-3" style={{ color: C.muted }}><span>Expenses</span><span>-{fmtCurrency(ownerReport.opsExp, ownerCur)}</span></div>
              <div className="flex items-center justify-between text-sm font-semibold mt-1" style={{ color: "var(--accent, #111111)" }}><span>Balance</span><span>{fmtCurrency(ownerReport.opsBalance, ownerCur)}</span></div>
            </Card>
          </div>

          <Card style={{ background: C.teal }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>Owners Running Balance — {ownerCur}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold" style={{ color: "#fff" }}>{fmtCurrency(ownerReport.runningBalance, ownerCur)}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>prev {fmtCurrency(ownerReport.prevOwners, ownerCur)} + this month</p>
            </div>
          </Card>

          <SubToggle value={ownerSub} onChange={setOwnerSub} options={[{ key: "income", label: "Income" }, { key: "expenses", label: "Expenses" }]} />

          {ownerSub === "income" && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Income — {monthLabel} ({ownerCur})</p>
              <div className="flex flex-col gap-2">
                {ownerIncomeRows.length === 0 && monthManualIncome.length === 0 && (
                  <p className="text-sm" style={{ color: C.muted }}>No {ownerCur} income for {monthLabel}.</p>
                )}
                {ownerIncomeRows.map((r) => (
                  <div key={r.booking.id} className="flex flex-col gap-1 py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.text }}>{r.booking.guest}</p>
                        <p className="text-xs" style={{ color: C.muted }}>{r.booking.checkIn} → {r.booking.checkOut}</p>
                        {r.booking.paidAt && <p className="text-xs" style={{ color: C.teal }}>Confirmed {r.booking.paidAt}</p>}
                      </div>
                      <Pill tone={r.booking.status === "CONFIRMED" ? "teal" : "amber"}>
                        {r.booking.status === "CONFIRMED" ? "Confirmed" : "Expected"}
                      </Pill>
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs" style={{ color: C.muted }}>
                        Owners {allocOwner.owners}%: <span className="font-semibold" style={{ color: C.text }}>{fmtCurrency(r.ownersAmt, ownerCur)}</span>
                      </span>
                      <span className="text-xs" style={{ color: C.muted }}>
                        Operations {allocOwner.operations}%: <span className="font-semibold" style={{ color: C.text }}>{fmtCurrency(r.opsAmt, ownerCur)}</span>
                      </span>
                    </div>
                  </div>
                ))}
                {monthManualIncome.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{m.description}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{m.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone="muted">Manual</Pill>
                      <span className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(m.amount, ownerCur)}</span>
                    </div>
                  </div>
                ))}
                {(ownerIncomeRows.length > 0 || monthManualIncome.length > 0) && (
                  <div
                    className="flex items-center justify-between py-2 px-3 mt-1"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: C.text }}>
                      {fmtCurrency(ownerReport.ownersAlloc + ownerReport.opsAlloc + ownerReport.manualIncomeTotal, ownerCur)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {ownerSub === "expenses" && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Expenses — {monthLabel} ({ownerCur})</p>
              <div className="flex flex-col gap-2">
                {ownerLineItems.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No {ownerCur} expenses for {monthLabel}.</p>}
                {ownerLineItems.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div className="flex items-center gap-3">
                      <Pill tone={EXPENSE_CATEGORY_TONE[e.category]}>{EXPENSE_CATEGORY_LABEL[e.category]}</Pill>
                      <p className="text-sm" style={{ color: C.text }}>{e.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: C.muted }}>{e.date}</span>
                      <span className="text-sm font-semibold w-24 text-right" style={{ color: C.text }}>{fmtCurrency(applyMomo(e.amount, e.currency), ownerCur)}</span>
                    </div>
                  </div>
                ))}
                {ownerLineItems.length > 0 && (
                  <div
                    className="flex items-center justify-between py-2 px-3 mt-1"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: C.text }}>
                      {fmtCurrency(ownerReport.ownersExp + ownerReport.opsExp, ownerCur)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {tab === "oakco" && effectiveCanEdit && (
        <>
          <Card style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", border: "1px solid rgba(255,90,95,0.2)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--accent, #111111)" }}>Internal only — never visible to owners</p>
          </Card>

          <CurrencyToggle value={oakCur} onChange={setOakCurrency} currencies={propCurrencies} />

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>{managementLabel} Fund — {allocOak.management}%</p>
            <p className="text-2xl font-bold mt-2" style={{ color: C.text }}>{fmtCurrency(oakReport.managementAlloc, oakCur)}</p>
            <div className="flex items-center justify-between text-sm mt-3" style={{ color: C.muted }}><span>Team payments</span><span>-{fmtCurrency(oakReport.managementExp, oakCur)}</span></div>
            <div className="flex items-center justify-between text-sm font-semibold mt-1" style={{ color: "var(--accent, #111111)" }}><span>Balance</span><span>{fmtCurrency(oakReport.managementBalance, oakCur)}</span></div>
          </Card>

          <Card style={{ background: C.teal }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>{managementLabel} Running Balance — {oakCur}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold" style={{ color: "#fff" }}>{fmtCurrency(oakReport.runningBalance, oakCur)}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>prev {fmtCurrency(oakReport.prevManagement, oakCur)} + this month</p>
            </div>
          </Card>

          <SubToggle value={oakcoSub} onChange={setOakcoSub} options={[{ key: "income", label: "Income" }, { key: "expenses", label: "Expenses" }]} />

          {oakcoSub === "income" && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>{managementLabel} income — {monthLabel} ({oakCur})</p>
              <div className="flex flex-col gap-2">
                {oakIncomeRows.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No {oakCur} income for {monthLabel}.</p>}
                {oakIncomeRows.map((r) => (
                  <div key={r.booking.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{r.booking.guest}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{r.booking.checkIn} → {r.booking.checkOut} · Management {allocOak.management}%</p>
                      {r.booking.paidAt && <p className="text-xs" style={{ color: C.teal }}>Confirmed {r.booking.paidAt}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={r.booking.status === "CONFIRMED" ? "teal" : "amber"}>
                        {r.booking.status === "CONFIRMED" ? "Confirmed" : "Expected"}
                      </Pill>
                      <span className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(r.amt, oakCur)}</span>
                    </div>
                  </div>
                ))}
                {oakIncomeRows.length > 0 && (
                  <div
                    className="flex items-center justify-between py-2 px-3 mt-1"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: C.text }}>{fmtCurrency(oakReport.managementAlloc, oakCur)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {oakcoSub === "expenses" && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Team payments — {monthLabel} ({oakCur})</p>
              <div className="flex flex-col gap-2">
                {oakExpItems.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No {oakCur} team payments for {monthLabel}.</p>}
                {oakExpItems.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div className="flex items-center gap-3">
                      <Pill tone="amber">{e.person}</Pill>
                      <p className="text-sm" style={{ color: C.text }}>{e.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: C.muted }}>{e.date}</span>
                      <span className="text-sm font-semibold w-24 text-right" style={{ color: C.text }}>{fmtCurrency(applyMomo(e.amount, e.currency), oakCur)}</span>
                    </div>
                  </div>
                ))}
                {oakExpItems.length > 0 && (
                  <div
                    className="flex items-center justify-between py-2 px-3 mt-1"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: C.text }}>{fmtCurrency(oakReport.managementExp, oakCur)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {effectiveCanEdit && showIncomeForm && (
        <AddIncomeForm
          onClose={() => setShowIncomeForm(false)}
          onSubmit={(input) => { createManualIncome.mutate(input); setShowIncomeForm(false); }}
          defaultDate={new Date().toISOString().slice(0, 10)}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          defaultCurrency={ownerCur}
        />
      )}
      {effectiveCanEdit && showExpenseForm && (
        <ExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSubmit={(input) => { createExpense.mutate(input); setShowExpenseForm(false); }}
          defaultDate={new Date().toISOString().slice(0, 10)}
          defaultCurrency={tab === "oakco" ? oakCur : ownerCur}
          defaultCategory={tab === "oakco" ? "MANAGEMENT" : "OPERATIONS"}
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          team={team}
          managementLabel={workspaceName}
        />
      )}
      {effectiveCanEdit && showReportModal && (
        <GenerateReportModal
          properties={properties}
          defaultPropertyId={activeProperty.id}
          defaultYear={fYear}
          defaultMonth={fMonth}
          managementLabel={managementLabel}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

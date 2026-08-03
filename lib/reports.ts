import { applyMomo, computeManagementReport, computeOwnersReport, sumConfirmedIncome } from "./financials";
import type { Allocation, Booking, Currency, Expense, ManualIncome, PrevBalance, Property } from "./types";

/** Recommendations render only in the PDF report (react-pdf's built-in
 * Helvetica lacks the cedi glyph ₵ — see components/report-pdf-document.tsx),
 * so this uses the same "GHS "/€ text format as that document's
 * fmtCurrencyPdf, not lib/format.ts's fmtCurrency. */
function fmtAmount(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === "EUR" ? `€${formatted}` : `GHS ${formatted}`;
}

/** context/07-mockup.jsx GenerateReportModal's two checkboxes ("Owner Report",
 * "Oak & Co. internal report") — a report can include either or both. */
export type ReportType = "owner" | "oakco";

const DEFAULT_ALLOCATION: Allocation = { owners: 60, operations: 15, management: 25 };

export interface ReportIncomeRow {
  kind: "booking" | "manual";
  label: string;
  sublabel?: string;
  date: string;
  amount: number;
}

export interface ReportExpenseRow {
  date: string;
  description: string;
  person: string | null;
  amount: number;
  currency: Currency;
  category: Expense["category"];
}

/** Per-currency, optional stated opening balance for a fund — see
 * buildMonthlyReport's `openingBalanceOverrides` param. */
export interface OpeningBalanceOverride {
  owners?: number;
  management?: number;
}

interface CurrencyMonthFigures {
  currency: Currency;
  confirmedIncome: number;
  manualIncomeTotal: number;
  owner: ReturnType<typeof computeOwnersReport>;
  management: ReturnType<typeof computeManagementReport>;
  incomeRows: ReportIncomeRow[];
  ownerExpenseRows: ReportExpenseRow[];
  managementExpenseRows: ReportExpenseRow[];
  momoTotal: number;
  ownersBalanceStated: boolean;
  managementBalanceStated: boolean;
}

export interface CurrencyReportSection {
  currency: Currency;
  current: CurrencyMonthFigures;
  previous: CurrencyMonthFigures | null;
}

export interface MonthlyReportData {
  propertyName: string;
  monthLabel: string;
  reportTypes: ReportType[];
  managementLabel: string;
  sections: CurrencyReportSection[];
  recommendations: string[];
  generatedAt: string;
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function computeCurrencyFigures(params: {
  currency: Currency;
  year: number;
  month: number;
  property: Property;
  bookings: Booking[];
  expenses: Expense[];
  manualIncome: ManualIncome[];
  openingBalanceOverride?: OpeningBalanceOverride;
}): CurrencyMonthFigures {
  const { currency, year, month, property, bookings, expenses, manualIncome, openingBalanceOverride } = params;
  const prefix = monthPrefix(year, month);

  const monthBookings = bookings.filter((b) => b.propertyId === property.id && b.currency === currency && b.checkIn.startsWith(prefix));
  const monthExpenses = expenses.filter((e) => e.propertyId === property.id && e.currency === currency && e.date.startsWith(prefix));
  const monthManualIncome = manualIncome.filter((m) => m.propertyId === property.id && m.currency === currency && m.date.startsWith(prefix));

  const allocation = property.allocation[currency] ?? DEFAULT_ALLOCATION;
  const storedPrevBalance: PrevBalance = currency === "GHS" ? property.prevBalanceGhs : property.prevBalanceEur;
  const ownersBalanceStated = openingBalanceOverride?.owners !== undefined;
  const managementBalanceStated = openingBalanceOverride?.management !== undefined;
  const prevBalance: PrevBalance = {
    owners: openingBalanceOverride?.owners ?? storedPrevBalance.owners,
    management: openingBalanceOverride?.management ?? storedPrevBalance.management,
  };
  const confirmedIncome = sumConfirmedIncome(monthBookings);

  const owner = computeOwnersReport({ confirmedIncome, allocation, monthExpenses, manualIncome: monthManualIncome, prevBalance });
  const management = computeManagementReport({ confirmedIncome, allocation, monthExpenses, prevBalance });

  const incomeRows: ReportIncomeRow[] = [
    ...monthBookings.map((b) => ({
      kind: "booking" as const,
      label: b.guest,
      sublabel: `${b.source === "AIRBNB" ? "Airbnb" : "Local"} · ${b.checkIn} to ${b.checkOut}`,
      date: b.checkIn,
      amount: b.amount,
    })),
    ...monthManualIncome.map((m) => ({
      kind: "manual" as const,
      label: m.description,
      date: m.date,
      amount: m.amount,
    })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));

  const toRow = (e: Expense): ReportExpenseRow => ({
    date: e.date,
    description: e.description,
    person: e.person,
    amount: applyMomo(e.amount, e.currency),
    currency: e.currency,
    category: e.category,
  });

  const ownerExpenseRows = monthExpenses
    .filter((e) => e.category === "OWNERS" || e.category === "OPERATIONS")
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(toRow);
  const managementExpenseRows = monthExpenses
    .filter((e) => e.category === "MANAGEMENT")
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(toRow);

  const momoTotal = currency === "GHS" ? monthExpenses.reduce((s, e) => s + e.amount * 0.01, 0) : 0;

  return {
    currency,
    confirmedIncome,
    manualIncomeTotal: owner.manualIncomeTotal,
    owner,
    management,
    incomeRows,
    ownerExpenseRows,
    managementExpenseRows,
    momoTotal,
    ownersBalanceStated,
    managementBalanceStated,
  };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

/**
 * Rule-based month-over-month recommendations — no external AI call, just
 * deterministic comparisons against the previous calendar month for each
 * currency/report-type combination requested. User decision 2026-08-03:
 * "Month-over-month comparisons" over a more open-ended recommendation engine.
 */
function buildRecommendations(sections: CurrencyReportSection[], reportTypes: ReportType[]): string[] {
  const notes: string[] = [];

  for (const section of sections) {
    const { currency, current, previous } = section;
    const fmt = (n: number) => fmtAmount(n, currency);

    if (!previous) {
      notes.push(`${currency}: this is the earliest recorded month for this property — no prior month to compare against yet.`);
      continue;
    }

    const incomeDelta = pctChange(current.confirmedIncome, previous.confirmedIncome);
    if (incomeDelta !== null && incomeDelta <= -20) {
      notes.push(`${currency} confirmed booking income is down ${Math.abs(incomeDelta).toFixed(0)}% versus last month (${fmt(current.confirmedIncome)} vs ${fmt(previous.confirmedIncome)}) — worth checking occupancy or pricing.`);
    } else if (incomeDelta !== null && incomeDelta >= 20) {
      notes.push(`${currency} confirmed booking income is up ${incomeDelta.toFixed(0)}% versus last month (${fmt(current.confirmedIncome)} vs ${fmt(previous.confirmedIncome)}) — strong month.`);
    } else if (previous.confirmedIncome === 0 && current.confirmedIncome > 0) {
      notes.push(`${currency}: first confirmed booking income recorded this month (${fmt(current.confirmedIncome)}).`);
    }

    if (reportTypes.includes("owner")) {
      const categories: { label: string; curr: number; prev: number; rows: ReportExpenseRow[] }[] = [
        { label: "Owners", curr: current.owner.ownersExp, prev: previous.owner.ownersExp, rows: current.ownerExpenseRows.filter((r) => r.category === "OWNERS") },
        { label: "Operations", curr: current.owner.opsExp, prev: previous.owner.opsExp, rows: current.ownerExpenseRows.filter((r) => r.category === "OPERATIONS") },
      ];
      for (const cat of categories) {
        const delta = pctChange(cat.curr, cat.prev);
        if (delta !== null && delta >= 20) {
          const top = [...cat.rows].sort((a, b) => b.amount - a.amount)[0];
          const topNote = top ? `, the largest single cost being "${top.description}" at ${fmt(top.amount)}` : "";
          notes.push(`${currency} ${cat.label} expenses are up ${delta.toFixed(0)}% versus last month (${fmt(cat.curr)} vs ${fmt(cat.prev)})${topNote}.`);
        }
      }

      if (current.ownersBalanceStated) {
        // A manually stated opening balance means the previous month's own
        // balance (computed with prev=0, since history may be incomplete)
        // isn't a like-for-like baseline — comparing against it would
        // misreport this month's true balance change, so skip the delta
        // and just state the result plainly.
        notes.push(`${currency} Owners balance held with the management company: ${fmt(current.owner.runningBalance)}, based on the opening balance you stated for this month rather than system history.`);
      } else {
        const balanceDelta = current.owner.runningBalance - previous.owner.runningBalance;
        if (current.owner.runningBalance < 0) {
          notes.push(`${currency} Owners balance is negative (${fmt(current.owner.runningBalance)}) — expenses have outpaced allocated income.`);
        } else if (balanceDelta < 0) {
          notes.push(`${currency} Owners balance held with the management company decreased by ${fmt(Math.abs(balanceDelta))} this month, now ${fmt(current.owner.runningBalance)}.`);
        } else if (balanceDelta > 0) {
          notes.push(`${currency} Owners balance held with the management company grew by ${fmt(balanceDelta)} this month, now ${fmt(current.owner.runningBalance)}.`);
        }
      }
    }

    if (reportTypes.includes("oakco")) {
      const mgmtDelta = pctChange(current.management.managementExp, previous.management.managementExp);
      if (mgmtDelta !== null && mgmtDelta >= 20) {
        const top = [...current.managementExpenseRows].sort((a, b) => b.amount - a.amount)[0];
        const topNote = top ? `, the largest single payment being to ${top.person ?? top.description} at ${fmt(top.amount)}` : "";
        notes.push(`${currency} Management/team payments are up ${mgmtDelta.toFixed(0)}% versus last month (${fmt(current.management.managementExp)} vs ${fmt(previous.management.managementExp)})${topNote}.`);
      }

      if (current.managementBalanceStated) {
        notes.push(`${currency} Management balance: ${fmt(current.management.runningBalance)}, based on the opening balance you stated for this month rather than system history.`);
      } else {
        const mgmtBalanceDelta = current.management.runningBalance - previous.management.runningBalance;
        if (current.management.runningBalance < 0) {
          notes.push(`${currency} Management balance is negative (${fmt(current.management.runningBalance)}).`);
        } else if (mgmtBalanceDelta < 0) {
          notes.push(`${currency} Management balance decreased by ${fmt(Math.abs(mgmtBalanceDelta))} this month, now ${fmt(current.management.runningBalance)}.`);
        }
      }
    }

    if (currency === "GHS" && current.momoTotal > 50) {
      notes.push(`GH₵${current.momoTotal.toFixed(2)} was paid in MoMo transaction charges this month (1% on GHS expenses) — consider batching payments to reduce fees.`);
    }
  }

  if (notes.length === 0) {
    notes.push("No notable changes from last month.");
  }
  return notes;
}

export function buildMonthlyReport(params: {
  property: Property;
  bookings: Booking[];
  expenses: Expense[];
  manualIncome: ManualIncome[];
  year: number;
  month: number;
  reportTypes: ReportType[];
  managementLabel: string;
  /** Per-currency stated opening balances — see OpeningBalanceOverride doc
   * comment. Applied only to this report's selected month, never to the
   * prior-month comparison used for recommendations. */
  openingBalanceOverrides?: Partial<Record<Currency, OpeningBalanceOverride>>;
}): MonthlyReportData {
  const { property, bookings, expenses, manualIncome, year, month, reportTypes, managementLabel, openingBalanceOverrides } = params;
  const prevYm = shiftMonth(year, month, -1);
  const currencies: Currency[] = property.currencies.length > 0 ? property.currencies : ["GHS"];

  const sections: CurrencyReportSection[] = currencies.map((currency) => {
    const current = computeCurrencyFigures({
      currency, year, month, property, bookings, expenses, manualIncome,
      openingBalanceOverride: openingBalanceOverrides?.[currency],
    });
    const hasPriorActivity =
      bookings.some((b) => b.propertyId === property.id && b.currency === currency && b.checkIn < monthPrefix(year, month)) ||
      expenses.some((e) => e.propertyId === property.id && e.currency === currency && e.date < monthPrefix(year, month));
    const previous = hasPriorActivity
      ? computeCurrencyFigures({ currency, year: prevYm.year, month: prevYm.month, property, bookings, expenses, manualIncome })
      : null;
    return { currency, current, previous };
  });

  return {
    propertyName: property.name,
    monthLabel: `${MONTH_NAMES[month]} ${year}`,
    reportTypes,
    managementLabel,
    sections,
    recommendations: buildRecommendations(sections, reportTypes),
    generatedAt: new Date().toISOString().slice(0, 10),
  };
}

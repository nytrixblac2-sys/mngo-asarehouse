import { applyMomo, bookingOrderTotal, computeManagementReport, computeOwnersReport, confirmedBookings, outstandingBookings, sumConfirmedIncome, sumConfirmedIncomeHostel } from "./financials";
import type { Allocation, Booking, Currency, Expense, ManualIncome, Order, PrevBalance, Property } from "./types";

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
  allocationPct: Allocation;
  owner: ReturnType<typeof computeOwnersReport>;
  management: ReturnType<typeof computeManagementReport>;
  incomeRows: ReportIncomeRow[];
  /** Bookings that checked in this month but are still EXPECTED (unpaid) —
   * listed for owner transparency, never summed into confirmedIncome or
   * any total. See buildMonthlyReport's doc comment. */
  unconfirmedRows: ReportIncomeRow[];
  ownerExpenseRows: ReportExpenseRow[];
  managementExpenseRows: ReportExpenseRow[];
  ownersBalanceStated: boolean;
  managementBalanceStated: boolean;
}

export interface CurrencyReportSection {
  currency: Currency;
  current: CurrencyMonthFigures;
}

export interface MonthlyReportData {
  propertyName: string;
  monthLabel: string;
  reportTypes: ReportType[];
  managementLabel: string;
  sections: CurrencyReportSection[];
  generatedAt: string;
  /** HOSTEL workspaces have no owner/operations/management income split
   * (Architecture Decision 71) — the PDF collapses the Owners/Operations
   * allocation cards into one plain Income figure instead of showing a
   * permanently-0% Operations card. */
  isHostel?: boolean;
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
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
  orders: Order[];
  isHostel?: boolean;
  openingBalanceOverride?: OpeningBalanceOverride;
}): CurrencyMonthFigures {
  const { currency, year, month, property, bookings, expenses, manualIncome, orders, isHostel, openingBalanceOverride } = params;
  const prefix = monthPrefix(year, month);

  // Cash-basis: a booking counts toward a month's income when it was
  // *confirmed* (paidAt) in that month, not when the guest stayed
  // (checkIn) — see Architecture Decision 89.
  const monthBookings = confirmedBookings(bookings).filter(
    (b) => b.propertyId === property.id && b.currency === currency && b.paidAt!.startsWith(prefix)
  );
  const monthExpenses = expenses.filter((e) => e.propertyId === property.id && e.currency === currency && e.date.startsWith(prefix));
  const monthManualIncome = manualIncome.filter((m) => m.propertyId === property.id && m.currency === currency && m.date.startsWith(prefix));

  // Transparency, not income: bookings that checked in this month but
  // haven't been confirmed/paid — shown separately so the owner sees the
  // full picture of what came in, without those unpaid amounts touching
  // any total. Scoped by checkIn (when the stay happened), not paidAt,
  // since these have no paidAt yet.
  const monthUnconfirmed = outstandingBookings(bookings).filter(
    (b) => b.propertyId === property.id && b.currency === currency && b.checkIn.startsWith(prefix)
  );

  const allocation = property.allocation[currency] ?? DEFAULT_ALLOCATION;
  const storedPrevBalance: PrevBalance = currency === "GHS" ? property.prevBalanceGhs : property.prevBalanceEur;
  const ownersBalanceStated = openingBalanceOverride?.owners !== undefined;
  const managementBalanceStated = openingBalanceOverride?.management !== undefined;
  const prevBalance: PrevBalance = {
    owners: openingBalanceOverride?.owners ?? storedPrevBalance.owners,
    management: openingBalanceOverride?.management ?? storedPrevBalance.management,
  };
  const confirmedIncome = isHostel
    ? sumConfirmedIncomeHostel(monthBookings, orders, currency)
    : sumConfirmedIncome(monthBookings);

  const owner = computeOwnersReport({ confirmedIncome, allocation, monthExpenses, manualIncome: monthManualIncome, prevBalance });
  const management = computeManagementReport({ confirmedIncome, allocation, monthExpenses, prevBalance });

  const incomeRows: ReportIncomeRow[] = [
    ...monthBookings.map((b) => {
      const foodTotal = isHostel ? bookingOrderTotal(b.id, orders, currency) : 0;
      return {
        kind: "booking" as const,
        label: b.guest,
        sublabel:
          `${b.source === "AIRBNB" ? "Airbnb" : "Local"} · stayed ${b.checkIn} to ${b.checkOut} · confirmed ${b.paidAt}` +
          (foodTotal > 0 ? ` · room + food` : ""),
        // Sorted by paidAt (when the money arrived), not checkIn — that's
        // what determines this row's place in this specific month.
        date: b.paidAt!,
        amount: b.amount + foodTotal,
      };
    }),
    ...monthManualIncome.map((m) => ({
      kind: "manual" as const,
      label: m.description,
      date: m.date,
      amount: m.amount,
    })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));

  const unconfirmedRows: ReportIncomeRow[] = monthUnconfirmed
    .map((b) => ({
      kind: "booking" as const,
      label: b.guest,
      sublabel: `${b.source === "AIRBNB" ? "Airbnb" : "Local"} · stayed ${b.checkIn} to ${b.checkOut} · not yet paid`,
      // No paidAt to sort by yet — checkIn is the only date this row has.
      date: b.checkIn,
      amount: b.amount,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

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

  return {
    currency,
    confirmedIncome,
    manualIncomeTotal: owner.manualIncomeTotal,
    allocationPct: allocation,
    owner,
    management,
    incomeRows,
    unconfirmedRows,
    ownerExpenseRows,
    managementExpenseRows,
    ownersBalanceStated,
    managementBalanceStated,
  };
}

/**
 * User request, 2026-08-06: bookings that checked in this month but
 * haven't been confirmed/paid yet should still appear in the report, for
 * full owner transparency — "Victor's local booking that hasn't been
 * confirmed yet should still be listed, but there will be no money from
 * it because he hasn't paid yet." Each `CurrencyMonthFigures.unconfirmedRows`
 * lists them separately from `incomeRows`, and they're never added into
 * `confirmedIncome`, any allocation, or any running balance — only shown.
 */
export function buildMonthlyReport(params: {
  property: Property;
  bookings: Booking[];
  expenses: Expense[];
  manualIncome: ManualIncome[];
  /** HOSTEL only — RENTAL workspaces have no orders and can pass []. */
  orders?: Order[];
  year: number;
  month: number;
  reportTypes: ReportType[];
  managementLabel: string;
  /** Per-currency stated opening balances — see OpeningBalanceOverride doc
   * comment. Applied only to this report's selected month. */
  openingBalanceOverrides?: Partial<Record<Currency, OpeningBalanceOverride>>;
  isHostel?: boolean;
}): MonthlyReportData {
  const { property, bookings, expenses, manualIncome, orders, year, month, reportTypes, managementLabel, openingBalanceOverrides, isHostel } = params;
  const currencies: Currency[] = property.currencies.length > 0 ? property.currencies : ["GHS"];

  const sections: CurrencyReportSection[] = currencies.map((currency) => {
    const current = computeCurrencyFigures({
      currency, year, month, property, bookings, expenses, manualIncome, orders: orders ?? [], isHostel,
      openingBalanceOverride: openingBalanceOverrides?.[currency],
    });
    return { currency, current };
  });

  return {
    propertyName: property.name,
    monthLabel: `${MONTH_NAMES[month]} ${year}`,
    reportTypes,
    managementLabel,
    sections,
    generatedAt: new Date().toISOString().slice(0, 10),
    isHostel,
  };
}

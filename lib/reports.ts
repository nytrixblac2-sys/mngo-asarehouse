import { applyMomo, bookingOrderTotal, computeManagementReport, computeOwnersReport, sumConfirmedIncome, sumConfirmedIncomeHostel } from "./financials";
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
          `${b.source === "AIRBNB" ? "Airbnb" : "Local"} · ${b.checkIn} to ${b.checkOut}` +
          (foodTotal > 0 ? ` · room + food` : ""),
        date: b.checkIn,
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
    ownerExpenseRows,
    managementExpenseRows,
    ownersBalanceStated,
    managementBalanceStated,
  };
}

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

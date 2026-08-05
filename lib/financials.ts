import type { Allocation, Booking, Currency, Expense, ExpenseCategory, ManualIncome, Order, PrevBalance } from "./types";

/**
 * Financial calculations — context/03-code-standards.md: "Financial logic
 * lives in lib/financials.ts — never inline allocation calculations in
 * components." All calculations run client-side from raw API records per
 * context/02-architecture-context.md "Financial Calculation Model".
 */

/** MoMo charge (1%) applies to GHS only — context/03-code-standards.md
 * "Financial Logic Rules". Never apply to EUR. */
export function applyMomo(amount: number, currency: Currency): number {
  return currency === "GHS" ? amount * 1.01 : amount;
}

/** Only CONFIRMED bookings count as income — context/02-architecture-context.md
 * "Financial Calculation Model" ("confirmed income"). */
export function sumConfirmedIncome(bookings: Booking[]): number {
  return bookings.filter((b) => b.status === "CONFIRMED").reduce((s, b) => s + b.amount, 0);
}

/** A booking's own non-deleted food/drink spend, in one currency —
 * guest orders tied to their stay (Architecture Decision 84). Orders are
 * already deletedAt-filtered by the API by default, but this checks too
 * defensively rather than trusting every caller passed an already-filtered
 * list. */
export function bookingOrderTotal(bookingId: string, orders: Order[], currency: Currency): number {
  return orders
    .filter((o) => o.bookingId === bookingId && o.deletedAt === null)
    .flatMap((o) => o.items)
    .filter((i) => i.currency === currency)
    .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

/**
 * HOSTEL-aware confirmed income: each CONFIRMED booking's room amount
 * plus that same booking's own order total — the guest's food/drink
 * spend belongs to their stay's income, not a separate untracked bucket.
 * Fixes the real bug reported directly by the user: "when a guest orders
 * and checks out it should show in financials, right now it doesn't add
 * — it should be tied to the guest" (Architecture Decision 84).
 */
export function sumConfirmedIncomeHostel(bookings: Booking[], orders: Order[], currency: Currency): number {
  return bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.amount + bookingOrderTotal(b.id, orders, currency), 0);
}

export function sumExpensesByCategory(expenses: Expense[], category: ExpenseCategory): number {
  return expenses
    .filter((e) => e.category === category)
    .reduce((s, e) => s + applyMomo(e.amount, e.currency), 0);
}

export function sumManualIncome(entries: ManualIncome[]): number {
  return entries.reduce((s, m) => s + m.amount, 0);
}

export interface OwnersReport {
  ownersAlloc: number;
  opsAlloc: number;
  manualIncomeTotal: number;
  ownersExp: number;
  opsExp: number;
  ownersBalance: number;
  opsBalance: number;
  prevOwners: number;
  runningBalance: number;
}

/**
 * context/02-architecture-context.md "Financial Calculation Model":
 * Owners Running Balance = prev_balance.owners + (confirmed income ×
 * owners_pct/100) + (confirmed income × operations_pct/100) −
 * owners_expenses − operations_expenses.
 *
 * Extends the documented formula by also adding manual income
 * (owner contributions/top-ups) into the balance — context/07-mockup.jsx's
 * AddIncomeForm collects these entries but never actually folds them into
 * `ownerRunning`, which contradicts context/01-project-overview.md's own
 * description of the feature ("Add income (manual entries: owner
 * contributions, top-ups)" — a contribution that never affects the balance
 * isn't a contribution). Treated as a mockup gap, not intended behavior.
 */
export function computeOwnersReport(params: {
  confirmedIncome: number;
  allocation: Allocation;
  monthExpenses: Expense[];
  manualIncome: ManualIncome[];
  prevBalance: PrevBalance;
}): OwnersReport {
  const { confirmedIncome, allocation, monthExpenses, manualIncome, prevBalance } = params;
  const ownersAlloc = confirmedIncome * (allocation.owners / 100);
  const opsAlloc = confirmedIncome * (allocation.operations / 100);
  const manualIncomeTotal = sumManualIncome(manualIncome);
  const ownersExp = sumExpensesByCategory(monthExpenses, "OWNERS");
  const opsExp = sumExpensesByCategory(monthExpenses, "OPERATIONS");
  const ownersBalance = ownersAlloc - ownersExp;
  const opsBalance = opsAlloc - opsExp;
  const prevOwners = prevBalance.owners;
  const runningBalance = prevOwners + ownersBalance + opsBalance + manualIncomeTotal;
  return { ownersAlloc, opsAlloc, manualIncomeTotal, ownersExp, opsExp, ownersBalance, opsBalance, prevOwners, runningBalance };
}

export interface ManagementReport {
  managementAlloc: number;
  managementExp: number;
  managementBalance: number;
  prevManagement: number;
  runningBalance: number;
}

/**
 * context/02-architecture-context.md "Financial Calculation Model":
 * Management Running Balance = prev_balance.management + (confirmed
 * income × management_pct/100) − management_expenses.
 */
export function computeManagementReport(params: {
  confirmedIncome: number;
  allocation: Allocation;
  monthExpenses: Expense[];
  prevBalance: PrevBalance;
}): ManagementReport {
  const { confirmedIncome, allocation, monthExpenses, prevBalance } = params;
  const managementAlloc = confirmedIncome * (allocation.management / 100);
  const managementExp = sumExpensesByCategory(monthExpenses, "MANAGEMENT");
  const managementBalance = managementAlloc - managementExp;
  const prevManagement = prevBalance.management;
  const runningBalance = prevManagement + managementBalance;
  return { managementAlloc, managementExp, managementBalance, prevManagement, runningBalance };
}

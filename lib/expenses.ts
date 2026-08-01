import { z } from "zod";
import type { Expense } from "./types";

type ExpenseRow = {
  id: string;
  workspaceId: string;
  propertyId: string;
  date: Date;
  description: string;
  amount: unknown;
  currency: Expense["currency"];
  category: Expense["category"];
  person: string | null;
};

export function serializeExpense(e: ExpenseRow): Expense {
  return {
    id: e.id,
    workspaceId: e.workspaceId,
    propertyId: e.propertyId,
    date: e.date.toISOString().slice(0, 10),
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
    category: e.category,
    person: e.person,
  };
}

/** `person` is required for MANAGEMENT (team payment) expenses, matching
 * context/07-mockup.jsx ExpenseForm: `person: category === 'oak_co' ?
 * person : null`. Validated in the route, not just the schema shape,
 * since the requirement is conditional on `category`. */
export const expenseInputSchema = z.object({
  propertyId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["GHS", "EUR"]),
  category: z.enum(["OWNERS", "OPERATIONS", "MANAGEMENT"]),
  person: z.string().optional(),
});

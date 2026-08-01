import { z } from "zod";
import type { ManualIncome } from "./types";

type ManualIncomeRow = {
  id: string;
  workspaceId: string;
  propertyId: string;
  date: Date;
  description: string;
  amount: unknown;
  currency: ManualIncome["currency"];
};

export function serializeManualIncome(m: ManualIncomeRow): ManualIncome {
  return {
    id: m.id,
    workspaceId: m.workspaceId,
    propertyId: m.propertyId,
    date: m.date.toISOString().slice(0, 10),
    description: m.description,
    amount: Number(m.amount),
    currency: m.currency,
  };
}

export const manualIncomeInputSchema = z.object({
  propertyId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["GHS", "EUR"]),
});

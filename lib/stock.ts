import { z } from "zod";
import type { StockAdjustment } from "./types";

/** A restock/correction from the Shop admin screen — `delta` can be
 * either sign (restock: positive, damage/loss/miscount correction:
 * negative), and can't be zero (that wouldn't be an adjustment at all).
 * Automatic sale decrements (lib/api/shop/[slug]/orders) don't go through
 * this schema — they're server-generated, not user input. */
export const stockAdjustmentInputSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, "Adjustment can't be zero"),
  reason: z.string().min(1, "Reason is required"),
});

export function serializeStockAdjustment(row: {
  id: string;
  workspaceId: string;
  menuItemId: string;
  delta: number;
  reason: string;
  createdAt: Date;
}): StockAdjustment {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    menuItemId: row.menuItemId,
    delta: row.delta,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  };
}

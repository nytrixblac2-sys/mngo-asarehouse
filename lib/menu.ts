import { z } from "zod";
import type { MenuItem } from "./types";

type MenuItemRow = {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  price: unknown;
  currency: MenuItem["currency"];
  alwaysAvailable: boolean;
  isAvailableToday: boolean;
  station: MenuItem["station"];
};

export function serializeMenuItem(m: MenuItemRow): MenuItem {
  return {
    id: m.id,
    workspaceId: m.workspaceId,
    name: m.name,
    category: m.category,
    price: Number(m.price),
    currency: m.currency,
    alwaysAvailable: m.alwaysAvailable,
    isAvailableToday: m.isAvailableToday,
    station: m.station,
  };
}

/** An item is orderable when either flag is true — always-available items
 * don't need the daily toggle switched on. */
export function isMenuItemOrderable(m: Pick<MenuItem, "alwaysAvailable" | "isAvailableToday">): boolean {
  return m.alwaysAvailable || m.isAvailableToday;
}

export const menuItemInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  currency: z.enum(["GHS", "EUR"]),
  alwaysAvailable: z.boolean().optional(),
  station: z.enum(["KITCHEN", "BAR", "SHOP", "EXPERIENCE"]).optional(),
  /** Only checked by PATCH /api/menu/[id] when `price` actually changes
   * and the actor isn't the ACCOUNT_OWNER — see Architecture Decision 82.
   * Ignored on create (POST) and on edits that don't touch price. */
  pin: z.string().optional(),
});

export const availabilityInputSchema = z.object({
  isAvailableToday: z.boolean(),
});

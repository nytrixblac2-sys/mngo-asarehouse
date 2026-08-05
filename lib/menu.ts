import { z } from "zod";
import type { MenuItem } from "./types";

type MenuItemRow = {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  price: unknown;
  currency: MenuItem["currency"];
  isAvailableToday: boolean;
};

export function serializeMenuItem(m: MenuItemRow): MenuItem {
  return {
    id: m.id,
    workspaceId: m.workspaceId,
    name: m.name,
    category: m.category,
    price: Number(m.price),
    currency: m.currency,
    isAvailableToday: m.isAvailableToday,
  };
}

export const menuItemInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  currency: z.enum(["GHS", "EUR"]),
});

export const availabilityInputSchema = z.object({
  isAvailableToday: z.boolean(),
});

import { z } from "zod";
import { prisma } from "./prisma";
import type { Property, User } from "./types";

export function serializeProperty(p: {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  rooms: string[];
  facilities: string[];
  currencies: string[];
  allocation: unknown;
  prevBalanceGhs: unknown;
  prevBalanceEur: unknown;
}): Property {
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    color: p.color,
    rooms: p.rooms,
    facilities: p.facilities,
    currencies: p.currencies as Property["currencies"],
    allocation: p.allocation as Property["allocation"],
    prevBalanceGhs: p.prevBalanceGhs as Property["prevBalanceGhs"],
    prevBalanceEur: p.prevBalanceEur as Property["prevBalanceEur"],
  };
}

/**
 * Properties visible to a user: all workspace properties for
 * ACCOUNT_OWNER/CO_MANAGER, only explicitly assigned ones for
 * PROPERTY_OWNER — context/02-architecture-context.md "Auth and Access
 * Control Model": "Property Owners are scoped to specific properties via
 * the user_properties join table."
 */
export async function getVisibleProperties(user: User): Promise<Property[]> {
  if (user.role === "PROPERTY_OWNER") {
    const rows = await prisma.property.findMany({
      where: { workspaceId: user.workspaceId, owners: { some: { userId: user.id } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(serializeProperty);
  }

  const rows = await prisma.property.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(serializeProperty);
}

/** context/07-mockup.jsx PropertyForm — creation is name-only. Everything
 * else (color, currencies, allocation, rooms, facilities) is set
 * afterward via the Property profile modal. Clean slate per Architecture
 * Decision 31: prevBalance always starts at 0, no opening-balance input. */
export const createPropertySchema = z.object({
  name: z.string().min(1),
});

const allocationSchema = z.object({
  owners: z.number().min(0).max(100),
  operations: z.number().min(0).max(100),
  management: z.number().min(0).max(100),
});

/** context/02-architecture-context.md invariant #3: "Income allocation
 * percentages must sum to exactly 100% per currency before a property can
 * be saved." Enforced here, not just in the form UI. */
export const updatePropertySchema = z
  .object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    currencies: z.array(z.enum(["GHS", "EUR"])).min(1),
    allocation: z.record(z.enum(["GHS", "EUR"]), allocationSchema),
    rooms: z.array(z.string()),
    facilities: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    for (const currency of data.currencies) {
      const alloc = data.allocation[currency];
      if (!alloc) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Missing allocation for ${currency}` });
        continue;
      }
      const total = alloc.owners + alloc.operations + alloc.management;
      if (Math.round(total) !== 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${currency} allocation must sum to 100%, got ${total}%` });
      }
    }
  });

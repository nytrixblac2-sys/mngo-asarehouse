import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPropertySchema, getVisibleProperties, serializeProperty } from "@/lib/properties";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const properties = await getVisibleProperties(user);
  return apiSuccess(properties);
}

/**
 * Creates a property — name only, matching context/07-mockup.jsx
 * PropertyForm. Everything else defaults and is set afterward via the
 * Property profile modal. Clean slate per Architecture Decision 31:
 * prevBalance always starts at { owners: 0, management: 0 }, no
 * opening-balance input. Managers only.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = createPropertySchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const created = await prisma.property.create({
    data: {
      workspaceId: user.workspaceId,
      name: parsed.data.name,
      color: "#111111",
      rooms: [],
      facilities: [],
      currencies: ["GHS"],
      allocation: { GHS: { owners: 60, operations: 15, management: 25 } },
      prevBalanceGhs: { owners: 0, management: 0 },
      prevBalanceEur: { owners: 0, management: 0 },
    },
  });

  return apiSuccess(serializeProperty(created));
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { manualIncomeInputSchema, serializeManualIncome } from "@/lib/manual-income";

/**
 * Manual income (owner contributions, top-ups) — context/01-project-overview.md
 * "Financials". Always Owners-Fund money, never management-related, so
 * unlike expenses there's no category to exclude for PROPERTY_OWNER —
 * just the standard property scoping.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const propertyFilter =
    user.role === "PROPERTY_OWNER" ? { property: { owners: { some: { userId: user.id } } } } : {};

  const rows = await prisma.manualIncome.findMany({
    where: { workspaceId: user.workspaceId, ...propertyFilter },
    orderBy: { date: "asc" },
  });

  return apiSuccess(rows.map(serializeManualIncome));
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = manualIncomeInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const created = await prisma.manualIncome.create({
    data: {
      workspaceId: user.workspaceId,
      propertyId: parsed.data.propertyId,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
    },
  });

  return apiSuccess(serializeManualIncome(created));
}

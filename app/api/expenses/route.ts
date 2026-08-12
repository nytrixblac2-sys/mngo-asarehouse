import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { expenseInputSchema, serializeExpense } from "@/lib/expenses";

/**
 * All expenses visible to the requesting user. PROPERTY_OWNER sessions get
 * MANAGEMENT-category rows excluded entirely — context/02-architecture-context.md
 * invariant #1: "Management fund data is never returned to property_owner
 * role sessions — enforced server-side, not in component conditionals."
 * This is the actual enforcement point for that invariant; property-scoped
 * too, same as /api/bookings.
 *
 * Extended by Architecture Decision 87: on a HOSTEL workspace, MANAGEMENT
 * rows (team payments) are also excluded for anyone but the ACCOUNT_OWNER
 * — Janet manages the Team roster but shouldn't see what staff are paid,
 * only Akwasi should. RENTAL's CO_MANAGER (Cecilia) is unaffected.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId }, select: { type: true } });
  const isHostelNonOwner = workspace?.type === "HOSTEL" && user.role !== "ACCOUNT_OWNER";

  const propertyFilter =
    user.role === "PROPERTY_OWNER" ? { property: { owners: { some: { userId: user.id } } } } : {};
  const categoryFilter =
    user.role === "PROPERTY_OWNER" || isHostelNonOwner ? { category: { not: "MANAGEMENT" as const } } : {};

  const rows = await prisma.expense.findMany({
    where: { workspaceId: user.workspaceId, ...propertyFilter, ...categoryFilter },
    orderBy: { date: "asc" },
  });

  return apiSuccess(rows.map(serializeExpense));
}

/**
 * Creates an expense. Managers only, matching `canEdit` gating on the
 * mockup's "Add expense" button. `person` is required for MANAGEMENT
 * (team payment) expenses and rejected otherwise — the mockup's
 * ExpenseForm only shows the "Team member" field for the 'oak_co'
 * category, so a person on a non-MANAGEMENT expense would be meaningless.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = expenseInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  if (parsed.data.category === "MANAGEMENT" && !parsed.data.person?.trim()) {
    return apiError("A team member is required for management expenses", 400);
  }

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const created = await prisma.expense.create({
    data: {
      workspaceId: user.workspaceId,
      propertyId: parsed.data.propertyId,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      category: parsed.data.category,
      person: parsed.data.category === "MANAGEMENT" ? parsed.data.person!.trim() : null,
    },
  });

  return apiSuccess(serializeExpense(created));
}

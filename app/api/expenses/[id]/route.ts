import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { expenseInputSchema, serializeExpense } from "@/lib/expenses";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = expenseInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  if (parsed.data.category === "MANAGEMENT" && !parsed.data.person?.trim()) {
    return apiError("A team member is required for management expenses", 400);
  }

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      propertyId: parsed.data.propertyId,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      category: parsed.data.category,
      person: parsed.data.category === "MANAGEMENT" ? parsed.data.person!.trim() : null,
    },
  });

  return apiSuccess(serializeExpense(updated));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  await prisma.expense.delete({ where: { id: params.id } });
  return apiSuccess({ id: params.id });
}

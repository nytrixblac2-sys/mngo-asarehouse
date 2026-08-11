import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { orderDeleteInputSchema, deleteOrder, OrderError, serializeOrder } from "@/lib/orders";

/**
 * Deletes an order, or requests its deletion (Architecture Decision 99)
 * — ACCOUNT_OWNER deletes immediately; anyone else's delete becomes a
 * pending request the owner approves or rejects (see
 * POST /api/orders/[id]/approve-delete and reject-delete). See
 * lib/orders.ts deleteOrder for the full rule.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = orderDeleteInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  try {
    const order = await deleteOrder({
      workspaceId: user.workspaceId,
      orderId: params.id,
      actorRole: user.role,
      actorName: user.name,
      reason: parsed.data.reason,
    });
    return apiSuccess(serializeOrder(order));
  } catch (err) {
    if (err instanceof OrderError) return apiError(err.message, 409);
    throw err;
  }
}

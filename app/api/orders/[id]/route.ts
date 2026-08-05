import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { orderDeleteInputSchema, deleteOrder, OrderError, serializeOrder } from "@/lib/orders";

/**
 * Soft-deletes an order (Architecture Decision 79) — CO_MANAGER needs the
 * workspace PIN and a reason; ACCOUNT_OWNER needs just a reason. See
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
      pin: parsed.data.pin,
    });
    return apiSuccess(serializeOrder(order));
  } catch (err) {
    if (err instanceof OrderError) return apiError(err.message, err.message === "Incorrect PIN" ? 403 : 409);
    throw err;
  }
}

import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { rejectOrderDeletion, OrderError, serializeOrder } from "@/lib/orders";

/**
 * Owner rejects a pending delete request (Architecture Decision 99) —
 * nothing is deleted, the request is cleared. Owner only.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ACCOUNT_OWNER") return apiError("Forbidden", 403);

  try {
    const order = await rejectOrderDeletion({ workspaceId: user.workspaceId, orderId: params.id });
    return apiSuccess(serializeOrder(order));
  } catch (err) {
    if (err instanceof OrderError) return apiError(err.message, 409);
    throw err;
  }
}

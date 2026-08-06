import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { orderStatusInputSchema, setOrderStationStatus, OrderError, serializeOrder } from "@/lib/orders";

/**
 * Advances an order's fulfillment status for one station (Kitchen, Bar,
 * Shop, or Experiences) — the status buttons on that station's screen.
 * Managers only, same as placing an order.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = orderStatusInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  try {
    const order = await setOrderStationStatus({
      workspaceId: user.workspaceId,
      orderId: params.id,
      station: parsed.data.station,
      status: parsed.data.status,
    });
    return apiSuccess(serializeOrder(order));
  } catch (err) {
    if (err instanceof OrderError) return apiError(err.message, 404);
    throw err;
  }
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { orderInputSchema, createGuestOrder, OrderError, serializeOrder } from "@/lib/orders";

/** Orders in the workspace, optionally scoped to one booking via
 * ?bookingId= — used both for a single guest's running food bill and,
 * later, workspace-wide reporting. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const bookingId = new URL(req.url).searchParams.get("bookingId");
  const rows = await prisma.order.findMany({
    where: { workspaceId: user.workspaceId, ...(bookingId ? { bookingId } : {}) },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(rows.map(serializeOrder));
}

/**
 * Places a food/drink order against a guest's booking — this is the
 * staff-side path (Janet ordering on a guest's behalf from the booking
 * detail view). The public guest self-ordering route (later phase) will
 * share the same createGuestOrder helper but with its own auth (booking
 * code + name session, not a staff login). Managers only here.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = orderInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  try {
    const order = await createGuestOrder({ workspaceId: user.workspaceId, ...parsed.data });
    return apiSuccess(serializeOrder(order));
  } catch (err) {
    if (err instanceof OrderError) return apiError(err.message, 409);
    throw err;
  }
}

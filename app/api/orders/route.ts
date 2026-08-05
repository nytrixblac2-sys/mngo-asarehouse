import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { orderInputSchema, createGuestOrder, OrderError, serializeOrder } from "@/lib/orders";

/** Orders in the workspace, optionally scoped to one booking via
 * ?bookingId= — used both for a single guest's running food bill and
 * workspace-wide reporting (Kitchen/Bar screens). Excludes soft-deleted
 * orders by default; ?deletedOnly=true returns only deleted ones, for the
 * owner-only "deleted orders" log (Architecture Decision 79) — owner only,
 * since it's the audit trail for a sensitive action. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const url = new URL(req.url);
  const bookingId = url.searchParams.get("bookingId");
  const deletedOnly = url.searchParams.get("deletedOnly") === "true";
  if (deletedOnly && user.role !== "ACCOUNT_OWNER") return apiError("Forbidden", 403);

  const rows = await prisma.order.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(bookingId ? { bookingId } : {}),
      deletedAt: deletedOnly ? { not: null } : null,
    },
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

import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BookingError, restoreBooking, serializeBooking } from "@/lib/bookings";

/**
 * Restores a soft-deleted booking (Architecture Decision 93) — owner only,
 * same gate as viewing the deleted-bookings log. No PIN needed to restore:
 * the PIN gate exists to make deleting harder, not undoing a delete.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ACCOUNT_OWNER") return apiError("Forbidden", 403);

  try {
    const booking = await restoreBooking({ workspaceId: user.workspaceId, bookingId: params.id });
    return apiSuccess(serializeBooking(booking));
  } catch (err) {
    if (err instanceof BookingError) return apiError(err.message, 409);
    throw err;
  }
}

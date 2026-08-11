import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { rejectBookingDeletion, BookingError, serializeBooking } from "@/lib/bookings";

/**
 * Owner rejects a pending delete request (Architecture Decision 99) —
 * nothing is deleted, the request is cleared. Owner only.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ACCOUNT_OWNER") return apiError("Forbidden", 403);

  try {
    const booking = await rejectBookingDeletion({ workspaceId: user.workspaceId, bookingId: params.id });
    return apiSuccess(serializeBooking(booking));
  } catch (err) {
    if (err instanceof BookingError) return apiError(err.message, 409);
    throw err;
  }
}

import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { approveBookingDeletion, BookingError, serializeBooking } from "@/lib/bookings";

/**
 * Owner approves a pending delete request (Architecture Decision 99),
 * finalizing it into an actual soft-delete. Owner only.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ACCOUNT_OWNER") return apiError("Forbidden", 403);

  try {
    const booking = await approveBookingDeletion({ workspaceId: user.workspaceId, bookingId: params.id });
    return apiSuccess(serializeBooking(booking));
  } catch (err) {
    if (err instanceof BookingError) return apiError(err.message, 409);
    throw err;
  }
}

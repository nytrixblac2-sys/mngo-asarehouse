import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createGuestOrder, OrderError, serializeOrder } from "@/lib/orders";
import { getGuestSessionBooking } from "@/lib/guest-session";

const publicOrderInputSchema = z.object({
  items: z
    .array(z.object({ menuItemId: z.string().uuid(), quantity: z.number().int().positive() }))
    .min(1),
});

/** A guest placing their own food order — the counterpart to the
 * staff-side POST /api/orders, sharing the same createGuestOrder helper
 * (same availability gate, same checked-out guard) but authenticated via
 * the guest session cookie instead of a staff login. */
export async function POST(req: Request) {
  const booking = await getGuestSessionBooking();
  if (!booking) return apiError("Not signed in", 401);

  const parsed = publicOrderInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  try {
    const order = await createGuestOrder({
      workspaceId: booking.workspaceId,
      bookingId: booking.id,
      items: parsed.data.items,
    });
    return apiSuccess(serializeOrder(order));
  } catch (err) {
    if (err instanceof OrderError) return apiError(err.message, 409);
    throw err;
  }
}

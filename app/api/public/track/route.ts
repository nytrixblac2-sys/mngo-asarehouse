import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeBooking } from "@/lib/bookings";
import { setGuestSessionCookie } from "@/lib/guest-session";

const trackInputSchema = z.object({
  bookingCode: z.string().min(1),
  guestName: z.string().min(1),
});

/**
 * A guest's entire "login" — booking code + the name on the booking, no
 * password. The code alone is already a high-entropy secret (7 chars from
 * a 33-char alphabet, unique in the database); the name is a light
 * confirmation on top, not the primary credential.
 */
export async function POST(req: Request) {
  const parsed = trackInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: parsed.data.bookingCode.trim().toUpperCase() },
  });

  if (!booking || booking.guest.trim().toLowerCase() !== parsed.data.guestName.trim().toLowerCase()) {
    return apiError("We couldn't find a booking matching that code and name.", 404);
  }

  await setGuestSessionCookie(booking.id);

  return apiSuccess(serializeBooking(booking));
}

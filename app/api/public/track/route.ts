import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeBooking } from "@/lib/bookings";
import { setGuestSessionCookie } from "@/lib/guest-session";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const trackInputSchema = z.object({
  bookingCode: z.string().min(1),
  guestName: z.string().min(1),
});

/**
 * A guest's entire "login" — booking code + the name on the booking, no
 * password. The code alone is already a high-entropy secret (7 chars from
 * a 33-char alphabet, unique in the database) so brute-forcing it alone is
 * impractical, but this is still the only thing standing between a guest
 * booking and someone else's stay details — rate-limited per IP as
 * defense in depth, same reasoning as /signup.
 */
export async function POST(req: Request) {
  const allowed = await checkRateLimit(`track:${clientIp(req)}`, 10, 15 * 60);
  if (!allowed) return apiError("Too many attempts. Try again in a few minutes.", 429);

  const parsed = trackInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: parsed.data.bookingCode.trim().toUpperCase() },
  });

  if (!booking || booking.deletedAt || booking.guest.trim().toLowerCase() !== parsed.data.guestName.trim().toLowerCase()) {
    return apiError("We couldn't find a booking matching that code and name.", 404);
  }

  await setGuestSessionCookie(booking.id);

  return apiSuccess(serializeBooking(booking));
}

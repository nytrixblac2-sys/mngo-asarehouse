import { apiSuccess } from "@/lib/api-response";
import { clearGuestSessionCookie } from "@/lib/guest-session";

/** Lets a guest sign out of the shared /track device (e.g. a family
 * checking their bill together) without waiting for the cookie to expire. */
export async function POST() {
  await clearGuestSessionCookie();
  return apiSuccess({ ok: true });
}

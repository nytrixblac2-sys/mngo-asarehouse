import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Signs a lightweight, cookie-carried session for the public /track guest
 * portal — deliberately not a real Supabase Auth account (no password, no
 * email required; guests "log in" with booking code + name per the
 * product decision). Reuses SUPABASE_SERVICE_ROLE_KEY as HMAC key
 * material rather than introducing a brand-new secret that would need to
 * be added to Vercel's env vars before this could deploy — it's already
 * a server-only secret never sent to the client, just being reused for a
 * second, unrelated signing purpose here.
 */
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COOKIE_NAME = "guest_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — comfortably covers any stay length

function sign(bookingId: string): string {
  const payload = Buffer.from(bookingId, "utf-8").toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    return Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

/** Sets the signed guest-session cookie for a booking — called right
 * after a successful /api/public/bookings or /api/public/track request. */
export async function setGuestSessionCookie(bookingId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(bookingId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearGuestSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Resolves the current guest session to a real Booking row, or null if
 * there's no cookie, a tampered/invalid one, or the booking no longer
 * exists. Every public/* route that acts on behalf of a guest calls this
 * instead of trusting any client-supplied bookingId directly.
 */
export async function getGuestSessionBooking() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const bookingId = verify(token);
  if (!bookingId) return null;

  return prisma.booking.findUnique({ where: { id: bookingId } });
}

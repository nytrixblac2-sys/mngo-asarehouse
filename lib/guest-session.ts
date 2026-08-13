import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Signs a lightweight, cookie-carried session for the public /track guest
 * portal — deliberately not a real Supabase Auth account (no password, no
 * email required; guests "log in" with booking code + name per the
 * product decision).
 *
 * Uses its own GUEST_SESSION_SECRET rather than reusing
 * SUPABASE_SERVICE_ROLE_KEY (a prior shortcut, taken to avoid adding a new
 * Vercel env var). Reusing the service-role key coupled two unrelated
 * trust boundaries: rotating it after a suspected leak would have also
 * silently invalidated every guest session, and there was no way to
 * rotate guest-session signing on its own without touching full admin DB
 * access. Falls back to the service-role key only if the new var isn't
 * set yet, so this doesn't break deploys that haven't added it — but a
 * dedicated secret should be set as soon as possible; see .env.example.
 */
const SECRET = process.env.GUEST_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
 * exists — including if it's been soft-deleted since the guest signed in,
 * which should end their access exactly like a hard delete used to. Every
 * public/* route that acts on behalf of a guest calls this instead of
 * trusting any client-supplied bookingId directly.
 */
export async function getGuestSessionBooking() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const bookingId = verify(token);
  if (!bookingId) return null;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  return booking && !booking.deletedAt ? booking : null;
}

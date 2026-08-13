import { prisma } from "./prisma";

/**
 * IP-scoped throttle for unauthenticated endpoints prone to abuse (guest
 * /track "login", public workspace /signup). No Redis/Upstash in the
 * stack, so this reuses the existing Postgres connection (RateLimitBucket)
 * rather than adding new infra. Best-effort under concurrent requests — a
 * race can let a couple of extra attempts through under heavy concurrency,
 * which is fine for a security throttle, unlike anything financial.
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!bucket || bucket.windowStart < windowStart) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return true;
  }

  if (bucket.count >= limit) return false;

  await prisma.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

/** Vercel/most proxies set x-forwarded-for to "client, proxy1, proxy2" —
 * the first entry is the original client. Falls back to a constant key
 * (shared fate for all callers) rather than throwing when it's absent,
 * e.g. in local dev without a proxy in front of the app. */
export function clientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

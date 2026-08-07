import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeBooking } from "@/lib/bookings";

const bodySchema = z.object({
  // Defaults to CONFIRMED so existing callers that PATCH with no body
  // (or an empty body) keep confirming, same as before this endpoint
  // could also revert a booking.
  status: z.enum(["CONFIRMED", "EXPECTED"]).default("CONFIRMED"),
  /** Only meaningful when status is CONFIRMED. Omit for the normal
   * one-click "Confirm payout" flow (defaults to today, same as before —
   * see Architecture Decision 90 below). Pass an explicit date to
   * *correct* an already-confirmed booking's date after the fact, e.g.
   * the button wasn't clicked the same day the money actually arrived.
   * Ignored when status is EXPECTED (paidAt is always cleared to null). */
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD").optional(),
});

/**
 * Sets a booking's payment-confirmation status, in either direction, and
 * — as of Architecture Decision 90 — lets that confirmation date be
 * corrected after the fact. Previously `paidAt` was always
 * server-computed as "today," never accepted from the client at all
 * (context/02-architecture-context.md invariant #4); that invariant is
 * now narrower: the *default* confirm action still always uses today
 * (the client can't backdate a fresh confirmation by omitting `paidAt`
 * and expecting anything but today), but an explicit edit is allowed,
 * gated the same as confirming itself (managers only). This exists
 * because Financials/reports now bucket income by `paidAt`, not
 * `checkIn` (Architecture Decision 89) — a wrong confirmation date
 * silently puts a booking's income in the wrong month's report, so staff
 * need a way to fix it directly rather than it being a support request.
 *
 * User clarification, 2026-08-04: "confirmed" means money was actually
 * sent/received, not just that a booking exists — the CSV bulk importer
 * was marking every imported row CONFIRMED regardless of whether payment
 * had really arrived (correct for genuinely historical backfill, wrong
 * for future/upcoming stays). This endpoint originally only moved
 * EXPECTED -> CONFIRMED with no way back; it now accepts a target status
 * so a wrongly-marked booking can be reverted to EXPECTED (clearing
 * `paidAt`) once someone realizes the money hasn't actually arrived, then
 * confirmed for real later. Managers only, matching context/07-mockup.jsx
 * (the "Confirm payout" button only renders for canEdit sessions) —
 * enforced here too, not just hidden client-side.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const raw = await req.text();
  const parsed = bodySchema.safeParse(raw ? JSON.parse(raw) : {});
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId || existing.deletedAt) {
    return apiError("Not found", 404);
  }

  const paidAt =
    parsed.data.status === "CONFIRMED"
      ? new Date(parsed.data.paidAt ?? new Date().toISOString().slice(0, 10))
      : null;

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status: parsed.data.status, paidAt },
  });

  return apiSuccess(serializeBooking(updated));
}

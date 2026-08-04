import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { Booking } from "@/lib/types";

const bodySchema = z.object({
  // Defaults to CONFIRMED so existing callers that PATCH with no body
  // (or an empty body) keep confirming, same as before this endpoint
  // could also revert a booking.
  status: z.enum(["CONFIRMED", "EXPECTED"]).default("CONFIRMED"),
});

/**
 * Sets a booking's payment-confirmation status, in either direction.
 * `paidAt` is always server-computed here, never accepted from the
 * client — context/02-architecture-context.md invariant #4 — the client
 * only says which status it wants, not what date to use.
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
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const today = new Date();
  const paidAt =
    parsed.data.status === "CONFIRMED"
      ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      : null;

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status: parsed.data.status, paidAt },
  });

  const data: Booking = {
    id: updated.id,
    workspaceId: updated.workspaceId,
    propertyId: updated.propertyId,
    guest: updated.guest,
    checkIn: updated.checkIn.toISOString().slice(0, 10),
    checkOut: updated.checkOut.toISOString().slice(0, 10),
    amount: Number(updated.amount),
    currency: updated.currency,
    source: updated.source,
    status: updated.status,
    paidAt: updated.paidAt ? updated.paidAt.toISOString().slice(0, 10) : null,
  };

  return apiSuccess(data);
}

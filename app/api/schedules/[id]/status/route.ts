import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { scheduleStatusInputSchema, serializeSchedule } from "@/lib/schedules";

/**
 * Changes a schedule's status, appending a new ScheduleStatusEvent — mirrors
 * PATCH /api/issues/[id] exactly (same status set, same optional note),
 * per the user's 2026-08-01 request for schedule status to work "just
 * like the way the status for the issues." A separate subresource rather
 * than folding into PATCH /api/schedules/[id], since that route is a full
 * field edit (property/type/date/assignedTo/note) with no history
 * bookkeeping — same split as booking's PATCH vs /confirm.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.schedule.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = scheduleStatusInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const updated = await prisma.schedule.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      statusHistory: { create: [{ status: parsed.data.status, note: parsed.data.note?.trim() || null }] },
    },
    include: { statusHistory: { orderBy: { at: "asc" } } },
  });

  return apiSuccess(serializeSchedule(updated));
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { scheduleInputSchema, serializeSchedule } from "@/lib/schedules";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.schedule.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = scheduleInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const updated = await prisma.schedule.update({
    where: { id: params.id },
    data: {
      propertyId: parsed.data.propertyId,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      assignedTo: parsed.data.assignedTo,
      note: parsed.data.note?.trim() || null,
    },
    include: { statusHistory: { orderBy: { at: "asc" } } },
  });

  return apiSuccess(serializeSchedule(updated));
}

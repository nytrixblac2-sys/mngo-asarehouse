import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { scheduleInputSchema, serializeSchedule } from "@/lib/schedules";

/** Property-scoped for PROPERTY_OWNER, same pattern as /api/bookings. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const propertyFilter =
    user.role === "PROPERTY_OWNER" ? { property: { owners: { some: { userId: user.id } } } } : {};

  const rows = await prisma.schedule.findMany({
    where: { workspaceId: user.workspaceId, ...propertyFilter },
    include: { statusHistory: { orderBy: { at: "asc" } } },
    orderBy: { date: "asc" },
  });

  return apiSuccess(rows.map(serializeSchedule));
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = scheduleInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const created = await prisma.schedule.create({
    data: {
      workspaceId: user.workspaceId,
      propertyId: parsed.data.propertyId,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      assignedTo: parsed.data.assignedTo,
      note: parsed.data.note?.trim() || null,
      statusHistory: { create: [{ status: "OPEN" }] },
    },
    include: { statusHistory: { orderBy: { at: "asc" } } },
  });

  return apiSuccess(serializeSchedule(created));
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { roomInputSchema, serializeRoom } from "@/lib/rooms";

/**
 * All rooms in the requesting user's workspace — open to every role (the
 * booking form's room dropdown and, later, the public booking page both
 * need this list; there's nothing sensitive in a room name/price).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const rows = await prisma.room.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(rows.map(serializeRoom));
}

/** Creates a room type with a fixed nightly rate. Managers only. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = roomInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const created = await prisma.room.create({
    data: {
      workspaceId: user.workspaceId,
      propertyId: parsed.data.propertyId,
      name: parsed.data.name,
      pricePerNight: parsed.data.pricePerNight,
      currency: parsed.data.currency,
      active: parsed.data.active ?? true,
    },
  });

  return apiSuccess(serializeRoom(created));
}

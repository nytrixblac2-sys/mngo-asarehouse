import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  /** Null clears the integration; string sets/updates it. */
  airbnbICalUrl: z.string().url().nullable(),
});

/**
 * Saves (or clears) the Airbnb iCal URL for a property.
 * Kept separate from PATCH /api/properties/[id] so the complex allocation
 * validation in updatePropertySchema doesn't need to run on every iCal save.
 * Managers only — same access rule as the main property PATCH.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { airbnbICalUrl: parsed.data.airbnbICalUrl },
  });

  return apiSuccess({ airbnbICalUrl: updated.airbnbICalUrl });
}

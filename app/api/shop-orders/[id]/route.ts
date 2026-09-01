import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

/** Admin: update shop order status. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const order = await prisma.shopOrder.findUnique({ where: { id: params.id } });
  if (!order || order.workspaceId !== user.workspaceId) return apiError("Not found", 404);

  const updated = await prisma.shopOrder.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
    include: { items: true },
  });

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    guestName: updated.guestName,
    createdAt: updated.createdAt.toISOString(),
    items: updated.items.map((i) => ({
      id: i.id, name: i.name, quantity: i.quantity,
      unitPrice: String(i.unitPrice), currency: i.currency,
    })),
  });
}

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

const schema = z.object({ hasShop: z.boolean() });

/** Owner only — toggle the shop on/off for this workspace. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ACCOUNT_OWNER") return apiError("Forbidden", 403);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  await prisma.workspace.update({
    where: { id: user.workspaceId },
    data: { hasShop: parsed.data.hasShop },
  });

  return apiSuccess({ hasShop: parsed.data.hasShop });
}

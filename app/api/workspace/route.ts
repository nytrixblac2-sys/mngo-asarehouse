import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * Workspace display name — not sensitive, open to all roles. Lets the UI
 * show the real workspace name ("Oak & Co.") instead of hardcoding it,
 * per Architecture Decision 7: MNGO is a reusable product, "Oak & Co." is
 * this workspace's own branding, not part of the product's vocabulary.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
    select: { id: true, name: true },
  });
  if (!workspace) return apiError("Not found", 404);

  return apiSuccess(workspace);
}

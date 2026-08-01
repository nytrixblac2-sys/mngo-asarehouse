import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { issueStatusInputSchema, serializeIssue } from "@/lib/issues";

/**
 * Changes an issue's status, appending a new IssueStatusEvent —
 * context/01-project-overview.md: "Every status change timestamped and
 * stored in status history." Serves both the mockup's "toggle" (client
 * computes Open <-> Resolved and calls this) and "set explicit status"
 * (Open / In Progress / Resolved picker) interactions with one primitive.
 * Managers only, matching `canEdit` gating on DaySummaryPanel's issue
 * toggle in context/07-mockup.jsx.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.issue.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }

  const parsed = issueStatusInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const updated = await prisma.issue.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      statusHistory: { create: [{ status: parsed.data.status, note: parsed.data.note?.trim() || null }] },
    },
    include: { statusHistory: { orderBy: { at: "asc" } } },
  });

  return apiSuccess(serializeIssue(updated));
}

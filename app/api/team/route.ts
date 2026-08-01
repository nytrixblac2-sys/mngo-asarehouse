import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeTeamMember, teamMemberInputSchema } from "@/lib/team";

/**
 * Team roster. Manager-only — context/05-ui-context.md "Navigation":
 * "Team is hidden from the Property Owner nav," and nothing about the
 * roster (names/roles) is meant to be owner-visible at all, not just
 * edit-gated. Used by ShiftForm's "Assigned to" picker, which is itself
 * only reachable behind canEdit.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const rows = await prisma.teamMember.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(rows.map(serializeTeamMember));
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = teamMemberInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const created = await prisma.teamMember.create({
    data: { workspaceId: user.workspaceId, name: parsed.data.name, role: parsed.data.role },
  });

  return apiSuccess(serializeTeamMember(created));
}

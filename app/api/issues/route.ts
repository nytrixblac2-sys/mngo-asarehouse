import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { issueInputSchema, serializeIssue } from "@/lib/issues";

/** Property-scoped for PROPERTY_OWNER, same pattern as /api/bookings.
 * Includes full statusHistory per context/01-project-overview.md "Issues &
 * Schedules": "Every status change timestamped and stored in status history." */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const propertyFilter =
    user.role === "PROPERTY_OWNER" ? { property: { owners: { some: { userId: user.id } } } } : {};

  const rows = await prisma.issue.findMany({
    where: { workspaceId: user.workspaceId, ...propertyFilter },
    include: { statusHistory: { orderBy: { at: "asc" } } },
    orderBy: { date: "asc" },
  });

  return apiSuccess(rows.map(serializeIssue));
}

/**
 * Creates an issue. `status` is computed server-side from `type`, never
 * client-supplied — context/07-mockup.jsx IssueForm: `status: type ===
 * 'Note' ? null : 'Open'`. NOTE issues are informational and never enter
 * the Open/In Progress/Resolved lifecycle (see prisma/schema.prisma
 * comment on Issue.status). When a status is assigned, its first
 * IssueStatusEvent is created in the same request.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = issueInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const initialStatus = parsed.data.type === "NOTE" ? null : ("OPEN" as const);

  const created = await prisma.issue.create({
    data: {
      workspaceId: user.workspaceId,
      propertyId: parsed.data.propertyId,
      date: new Date(parsed.data.date),
      type: parsed.data.type,
      description: parsed.data.description,
      guest: parsed.data.guest?.trim() || null,
      status: initialStatus,
      statusHistory: initialStatus ? { create: [{ status: initialStatus }] } : undefined,
    },
    include: { statusHistory: { orderBy: { at: "asc" } } },
  });

  return apiSuccess(serializeIssue(created));
}

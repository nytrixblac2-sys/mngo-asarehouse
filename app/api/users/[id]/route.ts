import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Removes a Property Owner's access — context/07-mockup.jsx ProfileModal
 * only shows "Remove" for `u.role !== 'manager'`, so this only ever
 * targets PROPERTY_OWNER rows; the Account Owner and any Co-Manager can't
 * be removed through this endpoint. Deletes both the `User` row (cascades
 * `UserProperty`) and the underlying Supabase Auth account, so the login
 * itself stops working — not just the in-app row.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }
  if (existing.role !== "PROPERTY_OWNER") {
    return apiError("Only Property Owner access can be removed here", 400);
  }

  await prisma.user.delete({ where: { id: params.id } });

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(existing.authId);

  return apiSuccess({ id: params.id });
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Removes a Property Owner's or Co-Manager's access. Originally
 * Property-Owner-only (context/07-mockup.jsx's ProfileModal never had a
 * "remove a manager" concept at all, not a deliberate security
 * restriction — the mockup simply didn't cover it) — extended to
 * Co-Managers, 2026-09-08, after the gap surfaced during real testing:
 * there was no way for an Account Owner to revoke a Co-Manager's access
 * at all. The Account Owner themselves can never be removed here — there
 * is exactly one per workspace, created at signup (lib/workspace-signup.ts),
 * and no other flow to replace them.
 *
 * Removing a Co-Manager is restricted to the Account Owner specifically
 * (not any manager, unlike Property Owner removal) since it revokes a
 * peer's full edit access, a more sensitive action than revoking an
 * owner's read-only view. Self-removal is blocked outright — "leave the
 * workspace" would be a distinct, deliberate feature, not a side effect
 * of this admin action.
 *
 * This only ever touches the login-capable `User` row (cascades
 * `UserProperty`) and the underlying Supabase Auth account, so the
 * person's login stops working — the separate `TeamMember` roster entry
 * used for payment-history tracking (Architecture Decision 87/97) is a
 * different model entirely, matched by name not by this row's id, and is
 * deliberately left untouched: removing someone's login shouldn't erase
 * the record of what they were already paid.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.workspaceId !== user.workspaceId) {
    return apiError("Not found", 404);
  }
  if (existing.role !== "PROPERTY_OWNER" && existing.role !== "CO_MANAGER") {
    return apiError("This account's access can't be removed here", 400);
  }
  if (existing.id === user.id) {
    return apiError("You can't remove your own access", 400);
  }
  if (existing.role === "CO_MANAGER" && user.role !== "ACCOUNT_OWNER") {
    return apiError("Only the Account Owner can remove a Co-Manager's access", 403);
  }

  await prisma.user.delete({ where: { id: params.id } });

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(existing.authId);

  return apiSuccess({ id: params.id });
}

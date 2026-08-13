import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { serializeWorkspaceUser, inviteUserSchema, generateTemporaryPassword } from "@/lib/users";

/**
 * Workspace roster — powers ProfileModal's "People with access" section
 * (manager-only, same total-exclusion pattern as GET /api/team —
 * Architecture Decision 27). Distinct from GET /api/team: this is real
 * login-capable Users (managers + Property Owners), not the informational
 * cleaner/caretaker roster.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const rows = await prisma.user.findMany({
    where: { workspaceId: user.workspaceId },
    include: { properties: { select: { propertyId: true } } },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(rows.map(serializeWorkspaceUser));
}

/**
 * Invites a Co-Manager or Property Owner into the current (already-
 * approved) workspace — distinct from app/signup, which creates a
 * brand-new workspace. Manager decision, 2026-07-31: no Resend/email
 * infra configured, so this creates a real Supabase Auth account with a
 * manager-generated one-time password, returned once in the response for
 * the manager to hand over directly (same trust model as texting a WiFi
 * password) — never emailed, never stored in plaintext after this
 * response. Property assignment only applies to PROPERTY_OWNER invites —
 * a Co-Manager already sees every workspace property (user decision,
 * 2026-08-01).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = inviteUserSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const propertyIds = parsed.data.role === "PROPERTY_OWNER" ? parsed.data.propertyIds : [];
  if (propertyIds.length > 0) {
    const propertyCount = await prisma.property.count({
      where: { id: { in: propertyIds }, workspaceId: user.workspaceId },
    });
    if (propertyCount !== propertyIds.length) {
      return apiError("One or more properties were not found", 404);
    }
  }

  const admin = createAdminClient();
  // perPage: 1000 — the 50-user default silently misses real duplicates
  // once the platform (shared across every workspace) has more users than
  // that; same fix as lib/workspace-signup.ts's own listUsers call.
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (existing?.users.some((u) => u.email === parsed.data.email)) {
    return apiError("An account with this email already exists", 400);
  }

  const temporaryPassword = generateTemporaryPassword();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });
  if (authError || !authData.user) {
    return apiError(authError?.message ?? "Could not create account", 400);
  }

  try {
    const created = await prisma.user.create({
      data: {
        authId: authData.user.id,
        workspaceId: user.workspaceId,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        mustChangePassword: true,
        properties: { createMany: { data: propertyIds.map((propertyId: string) => ({ propertyId })) } },
      },
      include: { properties: { select: { propertyId: true } } },
    });

    return apiSuccess({ user: serializeWorkspaceUser(created), temporaryPassword });
  } catch (err) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw err;
  }
}

import { z } from "zod";
import { prisma } from "./prisma";
import { createAdminClient } from "./supabase/admin";
import { uniqueWorkspaceSlug } from "./slugify";

export const workspaceSignupSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required"),
    name: z.string().min(1, "Your name is required"),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type WorkspaceSignupInput = z.infer<typeof workspaceSignupSchema>;

export class WorkspaceSignupError extends Error {}

/**
 * Public workspace signup — resolves Open Question 7 / Architecture
 * Decision 14. Creates a real Supabase Auth account + Workspace + Account
 * Owner User row immediately (same three-step bootstrap order as
 * Architecture Decision 11: workspace -> owner user -> backfill
 * accountOwnerId, avoiding the circular FK). The workspace starts
 * `status: PENDING` — the (app) layout blocks access for every role until
 * a platform admin approves it at /admin. This is a public form, but
 * nothing it creates is usable until a specific admin acts on it.
 */
export async function signUpWorkspace(input: WorkspaceSignupInput) {
  const admin = createAdminClient();

  const { data: existing } = await admin.auth.admin.listUsers();
  if (existing?.users.some((u) => u.email === input.email)) {
    throw new WorkspaceSignupError("An account with this email already exists.");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (authError || !authData.user) {
    throw new WorkspaceSignupError(authError?.message ?? "Could not create account.");
  }

  try {
    const slug = await uniqueWorkspaceSlug(input.companyName);
    const workspace = await prisma.workspace.create({
      data: { name: input.companyName, slug, status: "PENDING", paid: false },
    });

    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        workspaceId: workspace.id,
        name: input.name,
        email: input.email,
        role: "ACCOUNT_OWNER",
      },
    });

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { accountOwnerId: user.id },
    });

    return { workspaceId: workspace.id };
  } catch (err) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw err;
  }
}

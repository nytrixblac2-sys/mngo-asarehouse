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

/** Shown for every "couldn't create your workspace" case, whether the
 * email is already registered or account creation failed for some other
 * reason — never confirms or denies that a given email has an account.
 * This is a public, unauthenticated form; a distinct "already exists"
 * message here is a user-enumeration oracle (feed in emails, learn which
 * ones are registered anywhere on the platform), which is exactly the
 * kind of leak that turns into targeted phishing against a real person. */
const GENERIC_SIGNUP_FAILURE =
  "We couldn't create your workspace with those details. If you already have an account, try signing in instead.";

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

  // perPage: 1000 rather than the 50-user default — this checks across
  // every workspace on the shared platform (there's no per-workspace
  // scoping possible at the Auth-user level), so the default page size
  // would silently miss real duplicates once the platform has more than a
  // handful of total users.
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (existing?.users.some((u) => u.email === input.email)) {
    // Deliberately no early return with a distinct message (see
    // GENERIC_SIGNUP_FAILURE) — and a matching delay, since skipping the
    // real createUser call below would otherwise respond conspicuously
    // faster than the genuine-new-signup path, which is its own
    // (lower-severity, but real) timing side-channel for the same oracle.
    await new Promise((resolve) => setTimeout(resolve, 600));
    throw new WorkspaceSignupError(GENERIC_SIGNUP_FAILURE);
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (authError || !authData.user) {
    throw new WorkspaceSignupError(GENERIC_SIGNUP_FAILURE);
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

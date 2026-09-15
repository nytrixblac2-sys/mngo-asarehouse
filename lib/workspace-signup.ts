import { z } from "zod";
import { prisma } from "./prisma";
import { createAdminClient } from "./supabase/admin";
import { uniqueWorkspaceSlug } from "./slugify";
import { defaultAllocationForCurrencies } from "./properties";
import { CURRENCY_ENUM_VALUES } from "./currencies";

export const workspaceSignupSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required"),
    // The workspace's one property (Architecture Decision 94 — capped at
    // one per workspace) is created right here at signup instead of left
    // for a separate "Add property" step afterward — real user feedback,
    // 2026-09-15: a friend picked "Shop" but had no way to name the shop
    // itself (only the company/management name) or set its currency until
    // digging into an edit modal after admin approval, and by then had
    // already made a naming mistake with no visible way to fix it.
    propertyName: z.string().min(1, "This name is required"),
    name: z.string().min(1, "Your name is required"),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    // HOSTEL isn't offered here — every real Hostel workspace so far has
    // been admin/manual-onboarded (Escape3Points), and its financial model
    // (fixed 100/0/0 allocation, room-based bookings) needs a person to set
    // up correctly, not a self-serve form. RENTAL and STORE (added
    // 2026-09-13) are the two public self-serve options.
    workspaceType: z.enum(["RENTAL", "STORE"]).default("RENTAL"),
    currencies: z.array(z.enum(CURRENCY_ENUM_VALUES)).min(1, "Pick at least one currency").default(["GHS"]),
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
    // One transaction for all four writes — previously the workspace/user/
    // owner-backfill steps ran as separate un-transacted calls (pre-dating
    // the property creation added here), so a failure partway through
    // (now a real possibility: the property write is new) would leave an
    // orphaned workspace/user pointing at an auth account the catch below
    // deletes. Wrapped now rather than carrying that gap forward.
    const workspace = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: input.companyName, slug, type: input.workspaceType, status: "PENDING", paid: false },
      });

      const user = await tx.user.create({
        data: {
          authId: authData.user.id,
          workspaceId: workspace.id,
          name: input.name,
          email: input.email,
          role: "ACCOUNT_OWNER",
        },
      });

      await tx.workspace.update({
        where: { id: workspace.id },
        data: { accountOwnerId: user.id },
      });

      await tx.property.create({
        data: {
          workspaceId: workspace.id,
          name: input.propertyName,
          color: "#111111",
          rooms: [],
          facilities: [],
          currencies: input.currencies,
          allocation: defaultAllocationForCurrencies(input.workspaceType, input.currencies),
          prevBalanceGhs: { owners: 0, management: 0 },
          prevBalanceEur: { owners: 0, management: 0 },
        },
      });

      return workspace;
    });

    return { workspaceId: workspace.id };
  } catch (err) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw err;
  }
}

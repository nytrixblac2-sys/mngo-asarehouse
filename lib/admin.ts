import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/**
 * Platform admin = an email in PLATFORM_ADMIN_EMAILS, not a workspace
 * Role. Deliberately separate from every other access check in this app:
 * an admin approves/rejects new workspace signups and doesn't belong to
 * any single workspace, so there's no User row to check a Role on.
 */
function adminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** Use at the top of /admin routes. Redirects to /login if not a recognized admin. */
export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email || !isPlatformAdmin(authUser.email)) {
    redirect("/login");
  }

  return { email: authUser.email };
}

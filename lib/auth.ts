import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { prisma } from "./prisma";
import type { User } from "./types";

/**
 * Looks up the signed-in app user, or null if there's no session.
 * Uses supabase.auth.getUser() (revalidates against Supabase), never
 * getSession() — see Supabase's SSR guidance: getSession() reads an
 * unverified cookie value and must not be trusted for authorization.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    authId: dbUser.authId,
    workspaceId: dbUser.workspaceId,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    mustChangePassword: dbUser.mustChangePassword,
  };
}

/** Use at the top of any protected Server Component page. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

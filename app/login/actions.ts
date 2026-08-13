"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signIn(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  // Supabase Auth has its own server-side rate limiting on sign-in
  // attempts; this is a second, app-level layer keyed on IP+email so one
  // IP spraying many accounts (or one account from one IP) both get
  // throttled, not just whatever Supabase's project-wide limit catches.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkRateLimit(`login:${ip}:${parsed.data.email.toLowerCase()}`, 10, 15 * 60);
  if (!allowed) {
    redirect("/login?error=ratelimited");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    redirect("/login?error=credentials");
  }

  // Platform admins have no workspace User row — route them to /admin
  // instead of /dashboard, which would otherwise redirect back to /login.
  if (isPlatformAdmin(parsed.data.email)) {
    redirect("/admin");
  }

  redirect("/dashboard");
}

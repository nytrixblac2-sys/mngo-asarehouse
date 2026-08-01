"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/admin";

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

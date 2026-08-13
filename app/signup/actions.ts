"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUpWorkspace, workspaceSignupSchema, WorkspaceSignupError } from "@/lib/workspace-signup";
import { checkRateLimit } from "@/lib/rate-limit";

export async function signUp(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkRateLimit(`signup:${ip}`, 5, 60 * 60);
  if (!allowed) {
    redirect(`/signup?error=${encodeURIComponent("Too many attempts. Try again in a while.")}`);
  }

  const parsed = workspaceSignupSchema.safeParse({
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);
  }

  try {
    await signUpWorkspace(parsed.data);
  } catch (err) {
    const message = err instanceof WorkspaceSignupError ? err.message : "Something went wrong. Please try again.";
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    redirect("/login");
  }

  redirect("/dashboard");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUpWorkspace, workspaceSignupSchema, WorkspaceSignupError } from "@/lib/workspace-signup";

export async function signUp(formData: FormData) {
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

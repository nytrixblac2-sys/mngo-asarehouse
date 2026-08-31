import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Enter a valid email and password.",
  credentials: "Incorrect email or password.",
  ratelimited: "Too many attempts. Try again in a few minutes.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (isPlatformAdmin(authUser?.email)) redirect("/admin");

  const errorMessage = searchParams.error
    ? ERROR_MESSAGES[searchParams.error] ?? "Something went wrong."
    : null;

  return (
    <AuthLayout
      subtitle="Sign in to your workspace"
      footerContent={
        <>
          New management company?{" "}
          <a href="/signup" style={{ fontWeight: 600, color: "var(--at-teal, #0D9488)", textDecoration: "none" }}>
            Create a workspace
          </a>
        </>
      }
    >
      <LoginForm errorMessage={errorMessage} />
    </AuthLayout>
  );
}

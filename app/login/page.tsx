import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { C } from "@/lib/colors";
import { Card } from "@/components/primitives";
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
    <div className="flex w-full items-center justify-center" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <p className="text-xl font-bold" style={{ color: C.text }}>
            MNGO
          </p>
          <p className="mt-1 text-xs font-medium" style={{ color: C.muted }}>
            Booking tracking, reporting and owner insights
          </p>
        </div>
        <Card>
          <LoginForm errorMessage={errorMessage} />
        </Card>
        <p className="mt-4 text-center text-xs" style={{ color: C.muted }}>
          New management company? <a href="/signup" className="font-semibold" style={{ color: C.text }}>Create a workspace</a>
        </p>
      </div>
    </div>
  );
}

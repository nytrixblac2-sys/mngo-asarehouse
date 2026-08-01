import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { C } from "@/lib/colors";
import { Card } from "@/components/primitives";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex w-full items-center justify-center py-12" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <p className="text-xl font-bold" style={{ color: C.text }}>
            MNGO
          </p>
          <p className="mt-1 text-xs font-medium text-center" style={{ color: C.muted }}>
            Create a workspace for your management company
          </p>
        </div>
        <Card>
          <SignupForm errorMessage={searchParams.error ?? null} />
        </Card>
        <p className="mt-4 text-center text-xs" style={{ color: C.muted }}>
          Already have a workspace? <a href="/login" className="font-semibold" style={{ color: C.text }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}

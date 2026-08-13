import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { C } from "@/lib/colors";
import { Card } from "@/components/primitives";
import { ChangePasswordForm } from "./change-password-form";

/**
 * Forced first-login password change for a user still on their
 * manager-issued one-time invite password (User.mustChangePassword, set
 * on invite — app/api/users/route.ts). app/(app)/layout.tsx redirects here
 * for as long as the flag is set; this page redirects away once it isn't,
 * so it can't be used as a general "change my password" screen by mistake.
 */
export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  if (!user.mustChangePassword) redirect("/dashboard");

  return (
    <div className="flex w-full items-center justify-center" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <p className="text-xl font-bold" style={{ color: C.text }}>
            MNGO
          </p>
          <p className="mt-1 text-xs font-medium text-center" style={{ color: C.muted }}>
            Set your own password to continue
          </p>
        </div>
        <Card>
          <ChangePasswordForm errorMessage={searchParams.error ?? null} />
        </Card>
      </div>
    </div>
  );
}

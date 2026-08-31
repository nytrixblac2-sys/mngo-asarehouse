import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthLayout } from "@/components/auth-layout";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthLayout
      subtitle="Create a workspace for your management company"
      footerContent={
        <>
          Already have a workspace?{" "}
          <a href="/login" style={{ fontWeight: 600, color: "var(--at-teal, #0D9488)", textDecoration: "none" }}>
            Sign in
          </a>
        </>
      }
    >
      <SignupForm errorMessage={searchParams.error ?? null} />
    </AuthLayout>
  );
}

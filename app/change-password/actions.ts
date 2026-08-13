"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Completes the forced first-login password change (User.mustChangePassword,
 * set at invite time — app/api/users/route.ts). Sets the real Supabase
 * Auth password, then clears the flag so app/(app)/layout.tsx stops
 * redirecting here.
 */
export async function changePassword(formData: FormData) {
  const user = await requireUser();

  const parsed = schema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect(`/change-password?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid password")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    redirect(`/change-password?error=${encodeURIComponent(error.message)}`);
  }

  await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
  redirect("/dashboard");
}

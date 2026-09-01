import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase email-link verification (password reset, email confirm, etc.).
 * Supabase's default email template sends:
 *   {SITE_URL}/auth/confirm?token_hash={token}&type=recovery&next=/reset-password
 * This route verifies the token server-side and redirects to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as EmailOtpType | null;
  const next       = searchParams.get("next") ?? "/reset-password";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Invalid or expired link
  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}

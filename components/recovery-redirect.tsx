"use client";

import { useEffect } from "react";

/**
 * Mounted on the landing page. Supabase's default reset email redirects to the
 * Site URL (mngoghana.com/) with #access_token=...&type=recovery in the hash.
 * Since we can't edit the Supabase email template without custom SMTP, we catch
 * it here and forward to /reset-password so the form can handle it.
 */
export function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") && hash.includes("access_token")) {
      window.location.replace(`/reset-password${hash}`);
    }
  }, []);
  return null;
}

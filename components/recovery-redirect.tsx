"use client";

import { useEffect } from "react";

/**
 * Mounted on the landing page. Supabase's recovery email redirects back to the
 * Site URL (mngoghana.com/) because we can't edit the email template without
 * custom SMTP. We catch both token shapes here and forward to /reset-password:
 *
 *  - Implicit flow:  #access_token=...&type=recovery  (hash)
 *  - PKCE flow:      ?code=xxx                        (query string, default for @supabase/ssr)
 */
export function RecoveryRedirect() {
  useEffect(() => {
    const hash   = window.location.hash;
    const search = window.location.search;

    // Implicit / legacy flow
    if (hash.includes("type=recovery") && hash.includes("access_token")) {
      window.location.replace(`/reset-password${hash}`);
      return;
    }

    // PKCE flow — forward the code so the reset-password page can exchange it
    const params = new URLSearchParams(search);
    if (params.get("code")) {
      window.location.replace(`/reset-password${search}`);
    }
  }, []);
  return null;
}

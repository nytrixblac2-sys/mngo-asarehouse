import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security. Server-only:
 * never import this from a Client Component or expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser. Used for privileged
 * operations such as inviting Property Owners by email
 * (context/01-project-overview.md "Authentication and Roles").
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

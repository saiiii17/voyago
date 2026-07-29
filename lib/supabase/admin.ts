import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Server-only, never import
// from a Client Component. Only use for actions that legitimately cross a
// membership boundary (e.g. approving a join request creates a trip_members
// row for someone other than the caller) and ALWAYS after an explicit
// server-side authorization check (see lib/auth.ts).
// Untyped, same reasoning as lib/supabase/server.ts.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

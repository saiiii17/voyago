import { createBrowserClient } from "@supabase/ssr";

// No generic Database type here — see lib/supabase/server.ts for why: the
// hand-written schema in lib/types/database.ts is used for our own casts
// instead, so we don't have to fight supabase-js's stricter generic
// constraints (Relationships, Functions, etc.) without generated types.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-bound server client — respects RLS as the signed-in user.
// Use this for nearly everything; it's the primary authorization boundary.
//
// Deliberately untyped (no Database generic): lib/types/database.ts is a
// hand-written schema (no `supabase gen types` available without a linked
// project), and supabase-js's generic constraints expect more than Row/
// Insert/Update (Relationships, Functions, etc.) to type joins/inserts
// correctly. Fighting that without generated types isn't worth it — call
// sites cast query results to the interfaces in lib/types/database.ts
// instead.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — safe to ignore since
            // proxy.ts refreshes the session cookie on every request.
          }
        },
      },
    }
  );
}

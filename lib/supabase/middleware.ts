import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

// Header carrying the verified user id downstream, so page-level code (see
// getCurrentProfile in lib/auth.ts) can skip re-calling supabase.auth.getUser()
// — a second real network round-trip to Supabase's auth server that was
// otherwise happening on every single request on top of this one.
export const VERIFIED_USER_HEADER = "x-voyago-verified-user-id";

export async function updateSession(request: NextRequest) {
  // Cookies Supabase wants to set (on token refresh) are collected here and
  // applied to the one response we construct at the end, once the identity
  // header can be set alongside them — see the getUser() call below.
  let refreshedCookies: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          refreshedCookies = cookiesToSet;
        },
      },
    }
  );

  // Do not add logic between createServerClient and getUser() — it refreshes
  // the auth token and must run on every request that touches cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  if (user) {
    requestHeaders.set(VERIFIED_USER_HEADER, user.id);
  } else {
    requestHeaders.delete(VERIFIED_USER_HEADER);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  refreshedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

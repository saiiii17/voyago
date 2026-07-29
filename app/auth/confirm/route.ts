import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both link formats Supabase might send, depending on the project's
// auth flow setting (implicit token_hash vs. PKCE authorization code):
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/
//   {{ .SiteURL }}/auth/confirm?code={{ .Token }}&next=/   (PKCE, current default)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const authError = searchParams.get("error_code");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("exchangeCodeForSession failed:", error.message);
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("verifyOtp failed:", error.message);
  }

  const reason = authError === "otp_expired" ? "expired-link" : "invalid-link";
  return NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
}

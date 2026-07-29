"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      // Hard navigation, not router.push: guarantees the header and every
      // server-rendered page re-check auth state fresh, with no chance of a
      // stale client-side cache still showing the signed-in view.
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="rounded-full px-3 py-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
    >
      {signingOut ? "…" : "Sign out"}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-full px-3 py-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
    >
      Sign out
    </button>
  );
}

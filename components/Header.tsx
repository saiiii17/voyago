import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { Logo } from "@/components/Logo";

export async function Header() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#fbfaf8]/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3.5 sm:px-6">
        <div />
        <Logo />
        <div className="flex items-center justify-end">
          {profile && (
            <nav className="flex items-center gap-3 text-sm">
              {profile.is_master && (
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-1 rounded-full px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 sm:flex"
                >
                  ✨ Dashboard
                </Link>
              )}
              <div className="flex items-center gap-2 rounded-full bg-white py-1 pr-1 pl-1 ring-1 ring-stone-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                  {profile.display_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden pr-1.5 text-stone-600 sm:inline">{profile.display_name}</span>
              </div>
              <SignOutButton />
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "", label: "Overview", icon: "🏠" },
  { href: "/expenses", label: "Expenses", icon: "🧾" },
  { href: "/personal", label: "Personal", icon: "👤" },
  { href: "/places", label: "Places", icon: "📍" },
  { href: "/packing", label: "Packing", icon: "🎒" },
  { href: "/documents", label: "Docs", icon: "📄" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/summary", label: "Summary", icon: "📊" },
];

export function TripNav({ code }: { code: string }) {
  const pathname = usePathname();
  const base = `/trip/${code}`;

  return (
    <nav className="scrollbar-none -mx-4 mb-6 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {NAV_ITEMS.map((item) => {
        const href = `${base}${item.href}`;
        const isActive = item.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-600 text-white shadow-sm shadow-brand-900/15"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            )}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

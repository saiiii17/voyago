import Link from "next/link";

const ICON_SIZES = { sm: "h-9 w-9", md: "h-10 w-10", lg: "h-12 w-12" } as const;
const TEXT_SIZES = { sm: "text-lg", md: "text-xl sm:text-2xl", lg: "text-xl" } as const;

function CompassMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[52%] w-[52%]" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.75" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.1 8.9L12.85 12.85L8.9 15.1L11.15 11.15L15.1 8.9Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  size = "md",
  theme = "badge",
  href = "/",
  showText = true,
}: {
  size?: keyof typeof ICON_SIZES;
  theme?: "badge" | "ghost";
  href?: string | null;
  showText?: boolean;
}) {
  const mark = (
    <span
      className={`flex ${ICON_SIZES[size]} shrink-0 items-center justify-center rounded-2xl text-white ${
        theme === "badge"
          ? "bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm shadow-brand-900/20"
          : "bg-white/10 ring-1 ring-white/20 backdrop-blur-sm"
      }`}
    >
      <CompassMark />
    </span>
  );

  const wordmark = showText && (
    <span
      className={`font-semibold tracking-tight ${TEXT_SIZES[size]} ${
        theme === "ghost" ? "text-white" : "text-stone-900"
      }`}
    >
      Voyago
    </span>
  );

  if (!href) {
    return (
      <div className="flex items-center gap-3">
        {mark}
        {wordmark}
      </div>
    );
  }

  return (
    <Link href={href} className="flex items-center gap-3">
      {mark}
      {wordmark}
    </Link>
  );
}

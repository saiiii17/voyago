import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "brand" | "accent" | "stone" | "red";

const TONE_CLASSES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  accent: "bg-orange-50 text-accent-600 ring-1 ring-inset ring-orange-200",
  stone: "bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200",
  red: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
};

export function Badge({
  tone = "stone",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-900/10 hover:bg-brand-700 active:bg-brand-700 disabled:bg-brand-300 disabled:shadow-none",
  secondary:
    "bg-white text-stone-700 ring-1 ring-inset ring-stone-200 hover:bg-stone-50 hover:ring-stone-300 active:bg-stone-100 disabled:text-stone-300",
  danger:
    "bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 hover:ring-red-300 disabled:text-red-200",
  ghost: "bg-transparent text-stone-600 hover:bg-stone-100 active:bg-stone-200 disabled:text-stone-300",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  );
}

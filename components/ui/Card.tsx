import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/70 bg-white/90 p-5 shadow-[0_1px_2px_rgba(30,25,15,0.04),0_8px_24px_-12px_rgba(30,25,15,0.08)] backdrop-blur-sm sm:p-6",
        className
      )}
      {...props}
    />
  );
}

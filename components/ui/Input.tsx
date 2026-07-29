import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn("mb-1.5 block text-[13px] font-medium text-stone-600", props.className)}
    />
  );
}

const FIELD_CLASSES =
  "w-full rounded-xl border-0 bg-stone-100/80 px-3.5 py-2.5 text-sm text-stone-900 ring-1 ring-inset ring-stone-200 transition-shadow placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(FIELD_CLASSES, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(FIELD_CLASSES, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(FIELD_CLASSES, "bg-stone-100/80", props.className)} />;
}

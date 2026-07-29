"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ExpenseCategory } from "@/lib/types/database";

export interface ParsedTextExpenseResult {
  title: string | null;
  category: ExpenseCategory;
  currency: string;
  tax: number | null;
  tip: number | null;
  discount: number | null;
  items: { name: string; unitPrice: number; quantity: number; memberIds: string[] }[];
}

interface Props {
  code: string;
  onParsed: (result: ParsedTextExpenseResult) => void;
}

const PLACEHOLDER =
  'e.g. "Dinner at Pho 24: Sai and Minh had pho, 120k each. Minh also had a coke, 20k. ' +
  'Tax was 20k, tip 30k, split by everyone."';

export function DescribeExpenseInput({ code, onParsed }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${code}/expenses/parse-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not parse that — try rephrasing.");
        return;
      }
      onParsed(await res.json());
      setText("");
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white/60 p-5">
      <p className="mb-2 text-sm font-medium text-stone-700">💬 Describe it instead</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={3}
        className="w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-stone-900 ring-1 ring-inset ring-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p className="text-xs text-stone-400">Say who had what — we&apos;ll build the itemized split below.</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={loading || !text.trim()}
          className="shrink-0"
        >
          {loading ? "Thinking…" : "Generate split"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

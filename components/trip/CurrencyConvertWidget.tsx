"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "VND", "THB", "SGD", "AUD", "CAD", "JPY"];

export function CurrencyConvertWidget({ defaultFrom, defaultTo }: { defaultFrom: string; defaultTo: string }) {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convert() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/fx?from=${from}&to=${to}`);
      if (!res.ok) {
        setError("Couldn't fetch a rate for that pair.");
        return;
      }
      const { rate } = await res.json();
      setResult(amount * rate);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Quick convert</h2>
      <div className="flex flex-wrap items-end gap-2">
        <Input type="number" className="w-24" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <Select className="w-[92px]" value={from} onChange={(e) => setFrom(e.target.value)}>
          {[...new Set([from, ...CURRENCIES])].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <span className="pb-2.5 text-stone-300">→</span>
        <Select className="w-[92px]" value={to} onChange={(e) => setTo(e.target.value)}>
          {[...new Set([to, ...CURRENCIES])].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Button type="button" size="sm" onClick={convert} disabled={loading}>
          {loading ? "…" : "Convert"}
        </Button>
      </div>
      {result != null && (
        <p className="mt-3.5 text-sm text-stone-600">
          {formatCurrency(amount, from)} ≈{" "}
          <strong className="text-stone-900">{formatCurrency(result, to)}</strong>
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseCategory, PersonalExpense } from "@/lib/types/database";

const CATEGORIES: ExpenseCategory[] = ["food", "transport", "lodging", "activities", "shopping", "other"];

export function PersonalExpensesPanel({
  code,
  homeCurrency,
  initialExpenses,
}: {
  code: string;
  homeCurrency: string;
  initialExpenses: PersonalExpense[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState(homeCurrency);
  const [submitting, setSubmitting] = useState(false);

  const total = initialExpenses.reduce((sum, e) => sum + e.amount * e.fx_rate_to_home, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/trips/${code}/personal-expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, amount, currency }),
    });
    setSubmitting(false);
    setTitle("");
    setAmount(0);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/trips/${code}/personal-expenses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <p className="text-sm text-brand-100">Your personal spend (not split with the group)</p>
        <p className="text-3xl font-semibold tracking-tight">{formatCurrency(total, homeCurrency)}</p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Log a personal cost</h2>
        <form onSubmit={handleSubmit} className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="pTitle">What for</Label>
            <Input id="pTitle" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Flight ticket" />
          </div>
          <div>
            <Label htmlFor="pCategory">Category</Label>
            <Select id="pCategory" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="pAmount">Amount</Label>
            <Input id="pAmount" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="pCurrency">Currency</Label>
            <Input id="pCurrency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving…" : "Add"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-2">
        {initialExpenses.map((e) => (
          <Card key={e.id} className="flex items-center justify-between !p-4">
            <div>
              <p className="font-medium text-stone-900">{e.title}</p>
              <p className="text-xs text-stone-500 capitalize">
                {e.category} · {formatDate(e.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-stone-900">{formatCurrency(e.amount, e.currency)}</span>
              <button onClick={() => handleDelete(e.id)} className="text-stone-300 hover:text-red-500">
                ✕
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

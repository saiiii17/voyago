"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { TripMember } from "@/lib/types/database";

export function BudgetForm({
  code,
  member,
  homeCurrency,
}: {
  code: string;
  member: TripMember;
  homeCurrency: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(member.budget_amount?.toString() ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/trips/${code}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetAmount: amount ? Number(amount) : null,
        budgetCurrency: amount ? member.budget_currency ?? homeCurrency : null,
      }),
    });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">Your trip budget</h2>
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="budget">Budget ({member.budget_currency ?? homeCurrency})</Label>
          <Input
            id="budget"
            type="number"
            step="0.01"
            min="0"
            placeholder="No budget set"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-stone-400">
        Shown on the trip overview against what you&apos;ve actually spent so far.
      </p>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { MemberBalance, SettlementSuggestion } from "@/lib/split/types";
import type { TripMember } from "@/lib/types/database";

interface Props {
  code: string;
  homeCurrency: string;
  balances: MemberBalance[];
  suggestions: SettlementSuggestion[];
  members: TripMember[];
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <span
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 font-semibold text-brand-700 ring-1 ring-inset ring-brand-200/70`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function BalanceSummary({ code, homeCurrency, balances, suggestions: initialSuggestions, members }: Props) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameById = new Map(members.map((m) => [m.id, m.display_name]));
  const budgetById = new Map(members.map((m) => [m.id, m]));

  async function markPaid(s: SettlementSuggestion) {
    const key = `${s.fromMemberId}:${s.toMemberId}`;
    setBusyKey(key);
    setError(null);
    const previous = suggestions;
    // Optimistic: drop it from the list immediately. The balances table
    // above still shows pre-settlement figures until the background refresh
    // lands, but the actionable "still owes" list updates instantly.
    setSuggestions((prev) => prev.filter((x) => !(x.fromMemberId === s.fromMemberId && x.toMemberId === s.toMemberId)));

    try {
      const res = await fetch(`/api/trips/${code}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromMemberId: s.fromMemberId, toMemberId: s.toMemberId, amount: s.amount }),
      });
      if (!res.ok) {
        setSuggestions(previous);
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not mark that as paid.");
        return;
      }
      router.refresh();
    } catch {
      setSuggestions(previous);
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Balances</h2>

        {/* Desktop/tablet: full table. Below sm, six columns don't fit a phone
            without sideways scrolling, so mobile gets a stacked card per member. */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium tracking-wide text-stone-400 uppercase">
                <th className="pb-2.5 pr-4">Member</th>
                <th className="pb-2.5 pr-4 text-right">Paid</th>
                <th className="pb-2.5 pr-4 text-right">Consumed</th>
                <th className="pb-2.5 pr-4 text-right">Personal</th>
                <th className="pb-2.5 pr-4 text-right">Trip total</th>
                <th className="pb-2.5 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => {
                const member = budgetById.get(b.tripMemberId);
                const overBudget =
                  member?.budget_amount != null && b.totalTripCost > member.budget_amount;
                return (
                  <tr key={b.tripMemberId} className="border-t border-stone-100">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2 font-medium text-stone-800">
                        <Avatar name={b.displayName} />
                        {b.displayName}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-stone-600">{formatCurrency(b.totalPaid, homeCurrency)}</td>
                    <td className="py-2.5 pr-4 text-right text-stone-600">{formatCurrency(b.totalConsumed, homeCurrency)}</td>
                    <td className="py-2.5 pr-4 text-right text-stone-600">{formatCurrency(b.personalSpend, homeCurrency)}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className={overBudget ? "font-medium text-red-600" : "text-stone-800"}>
                        {formatCurrency(b.totalTripCost, homeCurrency)}
                      </span>
                      {member?.budget_amount != null && (
                        <span className="ml-1 text-xs text-stone-400">
                          / {formatCurrency(member.budget_amount, member.budget_currency ?? homeCurrency)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          b.netBalance >= 0 ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {b.netBalance >= 0 ? "+" : ""}
                        {formatCurrency(b.netBalance, homeCurrency)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2.5 sm:hidden">
          {balances.map((b) => {
            const member = budgetById.get(b.tripMemberId);
            const overBudget = member?.budget_amount != null && b.totalTripCost > member.budget_amount;
            return (
              <div key={b.tripMemberId} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-medium text-stone-800">
                    <Avatar name={b.displayName} />
                    {b.displayName}
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      b.netBalance >= 0 ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {b.netBalance >= 0 ? "+" : ""}
                    {formatCurrency(b.netBalance, homeCurrency)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-stone-500">
                  <div className="flex justify-between">
                    <span>Paid</span>
                    <span className="text-stone-700">{formatCurrency(b.totalPaid, homeCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consumed</span>
                    <span className="text-stone-700">{formatCurrency(b.totalConsumed, homeCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Personal</span>
                    <span className="text-stone-700">{formatCurrency(b.personalSpend, homeCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trip total</span>
                    <span className={overBudget ? "font-medium text-red-600" : "text-stone-700"}>
                      {formatCurrency(b.totalTripCost, homeCurrency)}
                      {member?.budget_amount != null &&
                        ` / ${formatCurrency(member.budget_amount, member.budget_currency ?? homeCurrency)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Settle up</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {suggestions.length === 0 ? (
          <p className="text-sm text-stone-500">Everyone&apos;s square. Nothing to settle. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => {
              const key = `${s.fromMemberId}:${s.toMemberId}`;
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar name={nameById.get(s.fromMemberId) ?? "?"} />
                    <span className="font-medium text-stone-800">{nameById.get(s.fromMemberId) ?? "Someone"}</span>
                    <span className="text-stone-400">→</span>
                    <Avatar name={nameById.get(s.toMemberId) ?? "?"} />
                    <span className="font-medium text-stone-800">{nameById.get(s.toMemberId) ?? "someone"}</span>
                    <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-200">
                      {formatCurrency(s.amount, homeCurrency)}
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" disabled={busyKey === key} onClick={() => markPaid(s)}>
                    {busyKey === key ? "Marking…" : "Mark as paid"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { PairwiseDebt } from "@/lib/split/pairwise";
import type { MemberBalance, SettlementSuggestion } from "@/lib/split/types";

export function DebtBreakdown({
  homeCurrency,
  balances,
  rawDebts,
  suggestions,
}: {
  homeCurrency: string;
  balances: MemberBalance[];
  rawDebts: PairwiseDebt[];
  suggestions: SettlementSuggestion[];
}) {
  const nameById = new Map(balances.map((b) => [b.tripMemberId, b.displayName]));
  const saved = rawDebts.length - suggestions.length;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 text-lg font-semibold text-stone-900">How this was calculated</h2>
        <p className="mb-4 text-sm text-stone-500">The exact steps behind every number on this page.</p>
        <ol className="space-y-3 text-sm text-stone-600">
          <li>
            <strong className="text-stone-900">1. What each person actually consumed.</strong> Every expense is
            split item by item — if you didn&apos;t have it, you don&apos;t pay for it. Tax, tip, and discounts are
            divided proportionally to what each person&apos;s items cost, not split evenly across the whole group.
          </li>
          <li>
            <strong className="text-stone-900">2. Paid vs. consumed, per person.</strong> For each person: total
            paid (money they actually handed over, across every expense) minus total consumed (their itemized
            share of everything) gives their net balance — positive means the group owes them, negative means they
            owe the group.
          </li>
          <li>
            <strong className="text-stone-900">3. Simplifying who pays whom.</strong> Left as-is, settling up would
            take {rawDebts.length} separate payment{rawDebts.length === 1 ? "" : "s"}
            {" "}— one for every person who owed another person anything, expense by expense. Instead: take
            whoever&apos;s owed the most and whoever owes the most, have them settle directly, and repeat until
            everyone nets to zero. The same total money changes hands, just in far fewer transfers.
          </li>
        </ol>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold text-stone-900">Before vs. after simplifying</h2>
        <p className="mb-4 text-sm text-stone-500">
          {rawDebts.length} raw debt{rawDebts.length === 1 ? "" : "s"} across every expense, simplified down to{" "}
          {suggestions.length} payment{suggestions.length === 1 ? "" : "s"}
          {saved > 0 ? ` — ${saved} fewer trips to the bank.` : "."}
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-stone-400 uppercase">Without simplifying</p>
            <ul className="space-y-1.5">
              {rawDebts.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm"
                >
                  <span className="text-stone-600">
                    {nameById.get(d.fromMemberId) ?? "?"} <span className="text-stone-300">→</span>{" "}
                    {nameById.get(d.toMemberId) ?? "?"}
                  </span>
                  <span className="shrink-0 font-medium text-stone-800">{formatCurrency(d.amount, homeCurrency)}</span>
                </li>
              ))}
              {rawDebts.length === 0 && <p className="text-sm text-stone-400">No expenses yet.</p>}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-brand-600 uppercase">Simplified</p>
            <ul className="space-y-1.5">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm ring-1 ring-inset ring-brand-100"
                >
                  <span className="text-stone-700">
                    {nameById.get(s.fromMemberId) ?? "?"} <span className="text-brand-300">→</span>{" "}
                    {nameById.get(s.toMemberId) ?? "?"}
                  </span>
                  <span className="shrink-0 font-semibold text-brand-800">{formatCurrency(s.amount, homeCurrency)}</span>
                </li>
              ))}
              {suggestions.length === 0 && <p className="text-sm text-stone-400">Everyone&apos;s square. 🎉</p>}
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Per-person breakdown</h2>
        <div className="space-y-2">
          {balances.map((b) => (
            <div key={b.tripMemberId} className="rounded-xl bg-stone-50 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium text-stone-900">{b.displayName}</p>
                <span className={`shrink-0 text-sm font-semibold ${b.netBalance >= 0 ? "text-brand-700" : "text-red-600"}`}>
                  {b.netBalance >= 0 ? "is owed " : "owes "}
                  {formatCurrency(Math.abs(b.netBalance), homeCurrency)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-stone-500">
                <div>
                  <p className="text-stone-400">Paid</p>
                  <p className="font-medium text-stone-700">{formatCurrency(b.totalPaid, homeCurrency)}</p>
                </div>
                <div>
                  <p className="text-stone-400">Consumed</p>
                  <p className="font-medium text-stone-700">{formatCurrency(b.totalConsumed, homeCurrency)}</p>
                </div>
                <div>
                  <p className="text-stone-400">Net</p>
                  <p className={`font-medium ${b.netBalance >= 0 ? "text-brand-700" : "text-red-600"}`}>
                    {b.netBalance >= 0 ? "+" : ""}
                    {formatCurrency(b.netBalance, homeCurrency)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { MemberBalance, SettlementSuggestion } from "@/lib/split/types";

interface Props {
  tripName: string;
  destination: string;
  homeCurrency: string;
  balances: MemberBalance[];
  suggestions: SettlementSuggestion[];
}

export function SummaryExport({ tripName, destination, homeCurrency, balances, suggestions }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const nameById = new Map(balances.map((b) => [b.tripMemberId, b.displayName]));

  async function handleExport() {
    if (!ref.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(ref.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${tripName.replace(/\s+/g, "-").toLowerCase()}-summary.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div ref={ref} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-6 text-white">
          <p className="text-xs font-medium tracking-wide text-brand-100 uppercase">Trip summary</p>
          <h2 className="text-2xl font-semibold tracking-tight">{tripName}</h2>
          <p className="text-sm text-brand-100">{destination}</p>
        </div>

        <div className="p-6">
          <table className="mb-6 w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs font-medium tracking-wide text-stone-400 uppercase">
                <th className="py-2">Member</th>
                <th className="py-2 text-right">Trip total</th>
                <th className="py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.tripMemberId} className="border-b border-stone-100">
                  <td className="py-2 font-medium text-stone-800">{b.displayName}</td>
                  <td className="py-2 text-right text-stone-600">{formatCurrency(b.totalTripCost, homeCurrency)}</td>
                  <td className={`py-2 text-right font-semibold ${b.netBalance >= 0 ? "text-brand-600" : "text-red-600"}`}>
                    {b.netBalance >= 0 ? "+" : ""}
                    {formatCurrency(b.netBalance, homeCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mb-2.5 text-sm font-semibold text-stone-900">Settle up</h3>
          {suggestions.length === 0 ? (
            <p className="text-sm text-stone-500">Everyone&apos;s square 🎉</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {suggestions.map((s) => (
                <li key={`${s.fromMemberId}:${s.toMemberId}`} className="flex justify-between rounded-lg bg-stone-50 px-3 py-2">
                  <span>
                    <strong className="text-stone-800">{nameById.get(s.fromMemberId)}</strong>
                    <span className="text-stone-400"> → </span>
                    <strong className="text-stone-800">{nameById.get(s.toMemberId)}</strong>
                  </span>
                  <span className="font-semibold text-stone-900">{formatCurrency(s.amount, homeCurrency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Button onClick={handleExport} disabled={exporting}>
        {exporting ? "Exporting…" : "⬇ Export as image"}
      </Button>
    </div>
  );
}

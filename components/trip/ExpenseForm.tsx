"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { ReceiptUpload } from "@/components/trip/ReceiptUpload";
import { DescribeExpenseInput, type ParsedTextExpenseResult } from "@/components/trip/DescribeExpenseInput";
import { ItemAssignmentGrid, type EditableItem } from "@/components/trip/ItemAssignmentGrid";
import { formatCurrency } from "@/lib/utils";
import type { TripMember, ExpenseCategory } from "@/lib/types/database";
import type { ParsedReceipt } from "@/lib/groq/receipt";

const CATEGORIES: ExpenseCategory[] = ["food", "transport", "lodging", "activities", "shopping", "other"];
const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "INR", "VND", "THB", "SGD", "AUD", "CAD", "JPY"];

function newItem(): EditableItem {
  return { key: crypto.randomUUID(), name: "", unitPrice: 0, quantity: 1, memberIds: [] };
}

export function ExpenseForm({
  code,
  members,
  homeCurrency,
}: {
  code: string;
  members: TripMember[];
  homeCurrency: string;
}) {
  const router = useRouter();

  const [splitMode, setSplitMode] = useState<"itemized" | "equal">("itemized");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "");
  const [currency, setCurrency] = useState(homeCurrency);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);

  const [items, setItems] = useState<EditableItem[]>([newItem()]);
  const [taxAmount, setTaxAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [equalTotal, setEqualTotal] = useState(0);
  const [equalParticipants, setEqualParticipants] = useState<string[]>(members.map((m) => m.id));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [items]
  );
  const computedTotal = subtotal + taxAmount + tipAmount - discountAmount;

  function handleScanned(parsed: ParsedReceipt, scannedReceiptUrl: string | null) {
    setSplitMode("itemized");
    if (parsed.merchant) setTitle(parsed.merchant);
    setCategory(parsed.category);
    if (parsed.currency && parsed.currency.length === 3) setCurrency(parsed.currency.toUpperCase());
    setItems(
      parsed.items.length > 0
        ? parsed.items.map((i) => ({
            key: crypto.randomUUID(),
            name: i.name,
            unitPrice: i.unitPrice,
            quantity: i.quantity || 1,
            memberIds: [],
          }))
        : [newItem()]
    );
    setTaxAmount(parsed.tax ?? 0);
    setTipAmount(parsed.tip ?? 0);
    setDiscountAmount(parsed.discount ?? 0);
    setReceiptImageUrl(scannedReceiptUrl);
  }

  function handleTextParsed(result: ParsedTextExpenseResult) {
    setSplitMode("itemized");
    if (result.title) setTitle(result.title);
    setCategory(result.category);
    if (result.currency && result.currency.length === 3) setCurrency(result.currency.toUpperCase());
    setItems(
      result.items.length > 0
        ? result.items.map((i) => ({
            key: crypto.randomUUID(),
            name: i.name,
            unitPrice: i.unitPrice,
            quantity: i.quantity || 1,
            memberIds: i.memberIds,
          }))
        : [newItem()]
    );
    setTaxAmount(result.tax ?? 0);
    setTipAmount(result.tip ?? 0);
    setDiscountAmount(result.discount ?? 0);
  }

  function toggleParticipant(id: string) {
    setEqualParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !paidBy) {
      setError("Give the expense a title and pick who paid.");
      return;
    }

    let payload;
    if (splitMode === "equal") {
      if (equalParticipants.length === 0) {
        setError("Pick at least one person who shared this.");
        return;
      }
      payload = {
        title,
        category,
        paidBy,
        currency,
        splitMode: "equal" as const,
        taxAmount: 0,
        tipAmount: 0,
        discountAmount: 0,
        totalAmount: equalTotal,
        receiptImageUrl,
        items: [{ name: title, unitPrice: equalTotal, quantity: 1, memberIds: equalParticipants }],
      };
    } else {
      const validItems = items.filter((it) => it.name.trim() && it.memberIds.length > 0);
      if (validItems.length === 0) {
        setError("Add at least one item and assign it to who shared it.");
        return;
      }
      payload = {
        title,
        category,
        paidBy,
        currency,
        splitMode: "itemized" as const,
        taxAmount,
        tipAmount,
        discountAmount,
        totalAmount: computedTotal,
        receiptImageUrl,
        items: validItems.map((it) => ({
          name: it.name,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          memberIds: it.memberIds,
        })),
      };
    }

    setSubmitting(true);
    const res = await fetch(`/api/trips/${code}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not save this expense.");
      return;
    }

    router.push(`/trip/${code}/expenses`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <ReceiptUpload code={code} onScanned={handleScanned} />
        <DescribeExpenseInput code={code} onParsed={handleTextParsed} />
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dinner at Pho 24" />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="paidBy">Paid by</Label>
            <Select id="paidBy" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {[...new Set([currency, ...COMMON_CURRENCIES])].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex rounded-xl bg-stone-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setSplitMode("itemized")}
            className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
              splitMode === "itemized" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Itemized split
          </button>
          <button
            type="button"
            onClick={() => setSplitMode("equal")}
            className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
              splitMode === "equal" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Split equally
          </button>
        </div>

        {splitMode === "itemized" ? (
          <div className="space-y-5">
            <ItemAssignmentGrid items={items} members={members} onChange={setItems} />
            <div className="grid grid-cols-3 gap-4 border-t border-stone-100 pt-5">
              <div>
                <Label htmlFor="tax">Tax</Label>
                <Input id="tax" type="number" step="0.01" min="0" value={taxAmount} onChange={(e) => setTaxAmount(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="tip">Tip</Label>
                <Input id="tip" type="number" step="0.01" min="0" value={tipAmount} onChange={(e) => setTipAmount(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="discount">Discount</Label>
                <Input id="discount" type="number" step="0.01" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-brand-50/60 px-4 py-3 text-sm ring-1 ring-inset ring-brand-100">
              <span className="text-stone-500">
                Subtotal {formatCurrency(subtotal, currency)} + tax/tip − discount
              </span>
              <span className="text-base font-semibold text-brand-800">{formatCurrency(computedTotal, currency)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <Label htmlFor="equalTotal">Total amount</Label>
              <Input
                id="equalTotal"
                type="number"
                step="0.01"
                min="0"
                required
                value={equalTotal}
                onChange={(e) => setEqualTotal(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Split between</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const checked = equalParticipants.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleParticipant(m.id)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
                        checked
                          ? "bg-brand-600 text-white ring-brand-600"
                          : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      {m.display_name}
                    </button>
                  );
                })}
              </div>
              {equalParticipants.length > 0 && equalTotal > 0 && (
                <p className="mt-2.5 text-xs text-stone-500">
                  {formatCurrency(equalTotal / equalParticipants.length, currency)} each
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Save expense"}
      </Button>
    </form>
  );
}

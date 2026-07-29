import { notFound } from "next/navigation";
import Image from "next/image";
import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { calculateExpenseBreakdown } from "@/lib/split/calculate";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DeleteExpenseButton } from "@/components/trip/DeleteExpenseButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TripMember } from "@/lib/types/database";

interface RawShare {
  trip_member_id: string;
  weight: number;
}
interface RawItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  expense_item_shares: RawShare[];
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ code: string; id: string }>;
}) {
  const { code, id } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const [{ data: expense }, { data: members }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, expense_items(*, expense_item_shares(*)), trip_members(display_name)")
      .eq("id", id)
      .eq("trip_id", access.trip.id)
      .single(),
    supabase.from("trip_members").select("*").eq("trip_id", access.trip.id),
  ]);

  if (!expense) notFound();

  const memberList = (members ?? []) as TripMember[];
  const nameById = new Map(memberList.map((m) => [m.id, m.display_name]));

  const breakdown = calculateExpenseBreakdown({
    id: expense.id,
    title: expense.title,
    paidBy: expense.paid_by,
    currency: expense.currency,
    fxRateToHome: expense.fx_rate_to_home,
    totalAmount: expense.total_amount,
    taxAmount: expense.tax_amount,
    tipAmount: expense.tip_amount,
    discountAmount: expense.discount_amount,
    items: ((expense.expense_items ?? []) as RawItem[]).map((item) => ({
      id: item.id,
      name: item.name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      shares: (item.expense_item_shares ?? []).map((s) => ({ tripMemberId: s.trip_member_id, weight: s.weight })),
    })),
  });

  const paidByName = (expense.trip_members as unknown as { display_name: string } | null)?.display_name ?? "?";

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">{expense.title}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
            Paid by <span className="font-medium text-stone-700">{paidByName}</span>
            <span className="text-stone-300">·</span>
            {formatDate(expense.created_at)}
            <Badge tone="brand" className="capitalize">
              {expense.category}
            </Badge>
          </p>
        </div>
        <DeleteExpenseButton code={code} id={expense.id} />
      </div>

      {expense.receipt_image_url && (
        <Image
          src={expense.receipt_image_url}
          alt="Receipt"
          width={240}
          height={320}
          className="rounded-2xl border border-stone-200 object-contain shadow-sm"
        />
      )}

      <Card>
        <h3 className="mb-4 font-semibold text-stone-900">Items</h3>
        <div className="space-y-3.5">
          {breakdown.items.map((item) => (
            <div key={item.itemId} className="border-b border-stone-100 pb-3.5 last:border-0 last:pb-0">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-stone-800">
                  {item.name} {item.quantity > 1 && <span className="text-stone-400">× {item.quantity}</span>}
                </span>
                <span className="text-stone-600">{formatCurrency(item.lineTotal, breakdown.currency)}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {item.sharedBy.map((s) => (
                  <span
                    key={s.tripMemberId}
                    className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
                  >
                    {nameById.get(s.tripMemberId) ?? "?"}: {formatCurrency(s.cost, breakdown.currency)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-stone-200 pt-4 text-sm text-stone-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(breakdown.subtotal, breakdown.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(expense.tax_amount, breakdown.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tip</span>
            <span>{formatCurrency(expense.tip_amount, breakdown.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>−{formatCurrency(expense.discount_amount, breakdown.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-1.5 text-base font-semibold text-stone-900">
            <span>Total</span>
            <span>{formatCurrency(expense.total_amount, breakdown.currency)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold text-stone-900">Who owes what for this expense</h3>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium tracking-wide text-stone-400 uppercase">
                <th className="pb-2">Member</th>
                <th className="pb-2 text-right">Items</th>
                <th className="pb-2 text-right">Tax</th>
                <th className="pb-2 text-right">Tip</th>
                <th className="pb-2 text-right">Discount</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.perMember.map((m) => (
                <tr key={m.tripMemberId} className="border-t border-stone-100">
                  <td className="py-2 font-medium text-stone-800">{nameById.get(m.tripMemberId) ?? "?"}</td>
                  <td className="py-2 text-right text-stone-600">{formatCurrency(m.subtotal, breakdown.currency)}</td>
                  <td className="py-2 text-right text-stone-600">{formatCurrency(m.taxShare, breakdown.currency)}</td>
                  <td className="py-2 text-right text-stone-600">{formatCurrency(m.tipShare, breakdown.currency)}</td>
                  <td className="py-2 text-right text-stone-600">−{formatCurrency(m.discountShare, breakdown.currency)}</td>
                  <td className="py-2 text-right font-semibold text-stone-900">
                    {formatCurrency(m.total, breakdown.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2.5 sm:hidden">
          {breakdown.perMember.map((m) => (
            <div key={m.tripMemberId} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-stone-800">{nameById.get(m.tripMemberId) ?? "?"}</span>
                <span className="font-semibold text-stone-900">{formatCurrency(m.total, breakdown.currency)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-500">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span className="text-stone-700">{formatCurrency(m.subtotal, breakdown.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="text-stone-700">{formatCurrency(m.taxShare, breakdown.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip</span>
                  <span className="text-stone-700">{formatCurrency(m.tipShare, breakdown.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-stone-700">−{formatCurrency(m.discountShare, breakdown.currency)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

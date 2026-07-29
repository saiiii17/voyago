import { createClient } from "@/lib/supabase/server";
import type { ExpenseInput } from "./types";

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
interface RawExpense {
  id: string;
  title: string;
  paid_by: string;
  currency: string;
  fx_rate_to_home: number;
  total_amount: number;
  tax_amount: number;
  tip_amount: number;
  discount_amount: number;
  expense_items: RawItem[];
}

/** Loads every expense in a trip, nested with its items and per-item member
 * shares, and reshapes it into the split engine's plain input format. */
export async function fetchExpenseInputs(tripId: string): Promise<ExpenseInput[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, title, paid_by, currency, fx_rate_to_home, total_amount, tax_amount, tip_amount, discount_amount, " +
        "expense_items(id, name, unit_price, quantity, expense_item_shares(trip_member_id, weight))"
    )
    .eq("trip_id", tripId);

  if (error) throw new Error(error.message);
  const expenses = (data ?? []) as unknown as RawExpense[];

  return expenses.map((e): ExpenseInput => ({
    id: e.id,
    title: e.title,
    paidBy: e.paid_by,
    currency: e.currency,
    fxRateToHome: e.fx_rate_to_home,
    totalAmount: e.total_amount,
    taxAmount: e.tax_amount,
    tipAmount: e.tip_amount,
    discountAmount: e.discount_amount,
    items: (e.expense_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      shares: (item.expense_item_shares ?? []).map((s) => ({
        tripMemberId: s.trip_member_id,
        weight: s.weight,
      })),
    })),
  }));
}

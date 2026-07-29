import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { calculateExpenseBreakdown } from "@/lib/split/calculate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from("expenses")
    .select("*, expense_items(*, expense_item_shares(*))")
    .eq("id", id)
    .eq("trip_id", access.trip.id)
    .single();

  if (error || !expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    items: (expense.expense_items ?? []).map((item: { id: string; name: string; unit_price: number; quantity: number; expense_item_shares: { trip_member_id: string; weight: number }[] }) => ({
      id: item.id,
      name: item.name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      shares: (item.expense_item_shares ?? []).map((s) => ({ tripMemberId: s.trip_member_id, weight: s.weight })),
    })),
  });

  return NextResponse.json({ expense, breakdown });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("trip_id", access.trip.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { getExchangeRate } from "@/lib/fx";

const EXPENSE_CATEGORIES = ["food", "transport", "lodging", "activities", "shopping", "other"] as const;

const itemInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().positive().default(1),
  memberIds: z.array(z.string().uuid()).min(1),
});

const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(EXPENSE_CATEGORIES),
  paidBy: z.string().uuid(),
  currency: z.string().trim().length(3).toUpperCase(),
  splitMode: z.enum(["itemized", "equal"]),
  taxAmount: z.number().nonnegative().default(0),
  tipAmount: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative(),
  receiptImageUrl: z.string().url().nullable().optional(),
  items: z.array(itemInputSchema).min(1),
});

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_items(*, expense_item_shares(*))")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = createExpenseSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;

  let fxRateToHome = 1;
  try {
    fxRateToHome = await getExchangeRate(input.currency, access.trip.home_currency);
  } catch {
    // Unsupported/unknown currency pair — fall back to 1:1 rather than blocking expense creation.
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const supabase = await createClient();

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      trip_id: access.trip.id,
      title: input.title,
      category: input.category,
      paid_by: input.paidBy,
      receipt_image_url: input.receiptImageUrl ?? null,
      currency: input.currency,
      fx_rate_to_home: fxRateToHome,
      subtotal,
      tax_amount: input.taxAmount,
      tip_amount: input.tipAmount,
      discount_amount: input.discountAmount,
      total_amount: input.totalAmount,
      split_mode: input.splitMode,
    })
    .select("*")
    .single();

  if (expenseError || !expense) {
    return NextResponse.json({ error: expenseError?.message ?? "Could not create expense" }, { status: 500 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("expense_items")
    .insert(
      input.items.map((item) => ({
        expense_id: expense.id,
        name: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
      }))
    )
    .select("*");

  if (itemsError || !items) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return NextResponse.json({ error: itemsError?.message ?? "Could not save items" }, { status: 500 });
  }

  const shareRows = items.flatMap((item, index) =>
    input.items[index].memberIds.map((memberId) => ({
      expense_item_id: item.id,
      trip_member_id: memberId,
      weight: 1,
    }))
  );

  const { error: sharesError } = await supabase.from("expense_item_shares").insert(shareRows);
  if (sharesError) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return NextResponse.json({ error: sharesError.message }, { status: 500 });
  }

  return NextResponse.json({ expense: { ...expense, items } }, { status: 201 });
}

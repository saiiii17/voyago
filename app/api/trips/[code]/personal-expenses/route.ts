import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { getExchangeRate } from "@/lib/fx";

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(["food", "transport", "lodging", "activities", "shopping", "other"]),
  amount: z.number().positive(),
  currency: z.string().trim().length(3).toUpperCase(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  // RLS already scopes this to the caller's own rows (or all, if a manager).
  const { data, error } = await supabase
    .from("personal_expenses")
    .select("*")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ personalExpenses: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.member) {
    return NextResponse.json({ error: "Only trip members can log personal costs" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let fxRateToHome = 1;
  try {
    fxRateToHome = await getExchangeRate(parsed.data.currency, access.trip.home_currency);
  } catch {
    // fall back to 1:1
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personal_expenses")
    .insert({
      trip_id: access.trip.id,
      trip_member_id: access.member.id,
      title: parsed.data.title,
      category: parsed.data.category,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      fx_rate_to_home: fxRateToHome,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ personalExpense: data }, { status: 201 });
}

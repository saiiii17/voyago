import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseExpenseText } from "@/lib/groq/text-expense";

const bodySchema = z.object({ text: z.string().trim().min(1).max(2000) });

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("trip_members")
    .select("id, display_name")
    .eq("trip_id", access.trip.id);

  if (!members || members.length === 0) {
    return NextResponse.json({ error: "This trip has no members yet." }, { status: 400 });
  }

  let result;
  try {
    result = await parseExpenseText(
      parsed.data.text,
      members.map((m) => m.display_name),
      access.trip.home_currency
    );
  } catch (err) {
    console.error("Text expense parsing failed:", err);
    return NextResponse.json(
      { error: "Could not understand that — try rephrasing or enter it manually." },
      { status: 502 }
    );
  }

  // Resolve each item's sharedBy names to trip_member ids case-insensitively.
  // A name the model didn't map to a real member is dropped rather than guessed —
  // the item just lands unassigned so it's obvious in the grid that it needs a check.
  const byLowerName = new Map(members.map((m) => [m.display_name.trim().toLowerCase(), m.id]));
  const items = result.items.map((item) => ({
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity || 1,
    memberIds: item.sharedBy
      .map((name) => byLowerName.get(name.trim().toLowerCase()))
      .filter((id): id is string => Boolean(id)),
  }));

  return NextResponse.json({
    title: result.title,
    category: result.category,
    currency: result.currency,
    tax: result.tax,
    tip: result.tip,
    discount: result.discount,
    items,
  });
}

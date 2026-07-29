import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";

const updateSchema = z.object({
  budgetAmount: z.number().nonnegative().nullable(),
  budgetCurrency: z.string().trim().length(3).toUpperCase().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // RLS also enforces this (self or manager), this check just gives a clean 403.
  if (access.member?.id !== id && !access.canManage) {
    return NextResponse.json({ error: "You can only set your own budget" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_members")
    .update({ budget_amount: parsed.data.budgetAmount, budget_currency: parsed.data.budgetCurrency })
    .eq("id", id)
    .eq("trip_id", access.trip.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  const { code, id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await createClient();

  const { data: member } = await supabase
    .from("trip_members")
    .select("id, profile_id")
    .eq("id", id)
    .eq("trip_id", access.trip.id)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (member.profile_id === access.trip.owner_id) {
    return NextResponse.json({ error: "Can't remove the trip owner." }, { status: 400 });
  }

  const { error } = await supabase.from("trip_members").delete().eq("id", id).eq("trip_id", access.trip.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.enum(["food", "attraction", "lodging", "transport", "activity", "other"]),
  notes: z.string().trim().max(1000).optional(),
  estimatedCost: z.number().nonnegative().nullable().optional(),
  currency: z.string().trim().length(3).toUpperCase().nullable().optional(),
  visitDate: z.string().date().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_places")
    .select("*")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ places: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.member) return NextResponse.json({ error: "Join the trip to add places" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_places")
    .insert({
      trip_id: access.trip.id,
      name: parsed.data.name,
      category: parsed.data.category,
      notes: parsed.data.notes ?? null,
      estimated_cost: parsed.data.estimatedCost ?? null,
      currency: parsed.data.currency ?? access.trip.home_currency,
      visit_date: parsed.data.visitDate ?? null,
      added_by: access.member.id,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ place: data }, { status: 201 });
}

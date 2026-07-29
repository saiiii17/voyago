import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  assignedTo: z.string().uuid().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packing_items")
    .select("*")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ packingItems: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.member) return NextResponse.json({ error: "Join the trip to add packing items" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packing_items")
    .insert({
      trip_id: access.trip.id,
      name: parsed.data.name,
      assigned_to: parsed.data.assignedTo ?? null,
      added_by: access.member.id,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ packingItem: data }, { status: 201 });
}

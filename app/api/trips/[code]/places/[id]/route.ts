import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";

const updateSchema = z.object({
  status: z.enum(["planned", "visited", "skipped"]).optional(),
  visitDate: z.string().date().nullable().optional(),
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

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.status === undefined && parsed.data.visitDate === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updates: { status?: string; visit_date?: string | null } = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.visitDate !== undefined) updates.visit_date = parsed.data.visitDate;

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_places")
    .update(updates)
    .eq("id", id)
    .eq("trip_id", access.trip.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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
  const { error } = await supabase.from("trip_places").delete().eq("id", id).eq("trip_id", access.trip.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

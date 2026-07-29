import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";

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
  const { error } = await supabase.from("trip_documents").delete().eq("id", id).eq("trip_id", access.trip.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

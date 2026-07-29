import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { sendJoinRequestEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Bypasses RLS deliberately: a friend who doesn't have access yet still
  // needs to resolve the trip's id/name/owner from its code to request to
  // join. Only minimal, non-sensitive fields are read.
  const admin = createAdminClient();
  const { data: trip } = await admin
    .from("trips")
    .select("id, name, owner_id")
    .eq("code", code)
    .single();
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const { data: existingMember } = await admin
    .from("trip_members")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (existingMember) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  const supabase = await createClient();
  const { data: joinRequest, error } = await supabase
    .from("join_requests")
    .upsert(
      { trip_id: trip.id, profile_id: profile.id, status: "pending", decided_at: null },
      { onConflict: "trip_id,profile_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: owner } = await admin.from("profiles").select("email").eq("id", trip.owner_id).single();
  if (owner) {
    const tripUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/trip/${code}`;
    await sendJoinRequestEmail({
      to: owner.email,
      tripName: trip.name,
      requesterName: profile.display_name,
      tripUrl,
    });
  }

  return NextResponse.json({ joinRequest }, { status: 201 });
}

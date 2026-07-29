import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { sendJoinApprovedEmail } from "@/lib/email";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("join_requests")
    .select("*, profiles(display_name, email)")
    .eq("trip_id", access.trip.id)
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ joinRequests: data });
}

const decisionSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  displayName: z.string().trim().min(1).max(60).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { requestId, action, displayName } = parsed.data;

  const supabase = await createClient();

  const { data: joinRequest } = await supabase
    .from("join_requests")
    .select("*, profiles(display_name, email)")
    .eq("id", requestId)
    .eq("trip_id", access.trip.id)
    .single();
  if (!joinRequest) return NextResponse.json({ error: "Join request not found" }, { status: 404 });

  const { error: updateError } = await supabase
    .from("join_requests")
    .update({ status: action === "approve" ? "approved" : "rejected", decided_at: new Date().toISOString() })
    .eq("id", requestId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (action === "approve") {
    const requesterProfile = joinRequest.profiles as unknown as { display_name: string; email: string };
    const { error: memberError } = await supabase.from("trip_members").insert({
      trip_id: access.trip.id,
      profile_id: joinRequest.profile_id,
      display_name: displayName ?? requesterProfile.display_name,
    });
    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

    await sendJoinApprovedEmail({
      to: requesterProfile.email,
      tripName: access.trip.name,
      tripUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/trip/${code}`,
    });
  }

  return NextResponse.json({ ok: true });
}

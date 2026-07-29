import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";

const MAX_BYTES = 15 * 1024 * 1024;

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_documents")
    .select("*")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.member) return NextResponse.json({ error: "Join the trip to add documents" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${access.trip.id}/${randomUUID()}-${file.name}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("trip-documents")
    .upload(path, buffer, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const fileUrl = admin.storage.from("trip-documents").getPublicUrl(path).data.publicUrl;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_documents")
    .insert({ trip_id: access.trip.id, name: file.name, file_url: fileUrl, uploaded_by: access.member.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data }, { status: 201 });
}

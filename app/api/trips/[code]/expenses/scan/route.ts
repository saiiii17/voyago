import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseReceiptImage } from "@/lib/groq/receipt";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mediaType = file.type || "image/jpeg";
  const base64 = buffer.toString("base64");

  let parsed;
  try {
    parsed = await parseReceiptImage(base64, mediaType);
  } catch (err) {
    console.error("Receipt parsing failed:", err);
    return NextResponse.json(
      { error: "Could not read that receipt automatically — try again or enter it manually." },
      { status: 502 }
    );
  }

  // Uploads always go through the service-role client (see supabase/schema.sql
  // storage bucket notes) rather than exposing a client-writable storage policy.
  const admin = createAdminClient();
  const ext = mediaType.split("/")[1] ?? "jpg";
  const path = `${access.trip.id}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage.from("receipts").upload(path, buffer, {
    contentType: mediaType,
    upsert: false,
  });

  let receiptImageUrl: string | null = null;
  if (!uploadError) {
    receiptImageUrl = admin.storage.from("receipts").getPublicUrl(path).data.publicUrl;
  }

  return NextResponse.json({ parsed, receiptImageUrl });
}

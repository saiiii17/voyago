import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { generateTripCode } from "@/lib/trip-code";

const createTripSchema = z.object({
  name: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(120),
  homeCurrency: z.string().trim().length(3).toUpperCase(),
  yourDisplayName: z.string().trim().min(1).max(60),
});

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ trips: data });
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!profile.is_master) {
    return NextResponse.json({ error: "Only the trip organizer can create new trips." }, { status: 403 });
  }

  const parsed = createTripSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, destination, homeCurrency, yourDisplayName } = parsed.data;

  const supabase = await createClient();

  let trip = null;
  let lastError: { code?: string; message: string } | null = null;
  for (let attempt = 0; attempt < 5 && !trip; attempt++) {
    const code = generateTripCode(destination);
    const { data, error } = await supabase
      .from("trips")
      .insert({ code, name, destination, home_currency: homeCurrency, owner_id: profile.id })
      .select("*")
      .single();

    if (data) {
      trip = data;
    } else if (error?.code !== "23505") {
      // Anything other than a unique-constraint collision on `code` is a real error.
      lastError = error;
      break;
    }
  }

  if (!trip) {
    return NextResponse.json({ error: lastError?.message ?? "Could not create trip" }, { status: 500 });
  }

  const { error: memberError } = await supabase.from("trip_members").insert({
    trip_id: trip.id,
    profile_id: profile.id,
    display_name: yourDisplayName,
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ trip }, { status: 201 });
}

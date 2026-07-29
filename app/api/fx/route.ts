import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getExchangeRate } from "@/lib/fx";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "Missing from/to" }, { status: 400 });

  try {
    const rate = await getExchangeRate(from, to);
    return NextResponse.json({ from: from.toUpperCase(), to: to.toUpperCase(), rate });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "FX lookup failed" }, { status: 502 });
  }
}

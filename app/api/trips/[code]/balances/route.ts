import { NextResponse } from "next/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { getTripBalances } from "@/lib/trip-data";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await getTripBalances(access.trip.id);

  return NextResponse.json({ homeCurrency: access.trip.home_currency, ...result });
}

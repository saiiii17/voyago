import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth-page";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { JoinTripButton } from "@/components/trip/JoinTripButton";

export default async function JoinTripPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await requireProfile();

  // Bypasses RLS deliberately — a friend without access yet still needs to
  // see the trip's name/destination to decide whether to request to join.
  const admin = createAdminClient();
  const { data: trip } = await admin
    .from("trips")
    .select("id, name, destination")
    .eq("code", code)
    .single();
  if (!trip) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-sm flex-col items-center justify-center px-4 text-center">
        <span className="mb-3 text-3xl">🧐</span>
        <p className="text-stone-500">Trip not found.</p>
      </div>
    );
  }

  const { data: member } = await admin
    .from("trip_members")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (member) redirect(`/trip/${code}`);

  const { data: existingRequest } = await admin
    .from("join_requests")
    .select("status")
    .eq("trip_id", trip.id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-sm flex-col items-center justify-center px-4">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-2xl shadow-lg shadow-accent-600/20">
        🌴
      </span>
      <Card className="w-full text-center">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">{trip.name}</h1>
        <p className="mb-6 text-sm text-stone-500">{trip.destination}</p>

        {existingRequest?.status === "pending" ? (
          <p className="rounded-xl bg-orange-50 p-3.5 text-sm text-orange-800 ring-1 ring-inset ring-orange-100">
            Your request to join is waiting for approval.
          </p>
        ) : existingRequest?.status === "rejected" ? (
          <div className="space-y-3">
            <p className="rounded-xl bg-red-50 p-3.5 text-sm text-red-800 ring-1 ring-inset ring-red-100">
              Your previous request was declined.
            </p>
            <JoinTripButton code={code} label="Request again" />
          </div>
        ) : (
          <JoinTripButton code={code} label="Request to join this trip" />
        )}
      </Card>
    </div>
  );
}

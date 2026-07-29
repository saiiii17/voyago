import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { PlacesPanel } from "@/components/trip/PlacesPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import type { TripPlace } from "@/lib/types/database";

export default async function PlacesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const { data } = await supabase
    .from("trip_places")
    .select("*")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Places & itinerary" subtitle="What you're planning to see and do" />
      <PlacesPanel code={code} homeCurrency={access.trip.home_currency} initialPlaces={(data ?? []) as TripPlace[]} />
    </div>
  );
}

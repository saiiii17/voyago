import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { PackingPanel } from "@/components/trip/PackingPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import type { PackingItem, TripMember } from "@/lib/types/database";

export default async function PackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const [{ data: items }, { data: members }] = await Promise.all([
    supabase.from("packing_items").select("*").eq("trip_id", access.trip.id).order("created_at", { ascending: true }),
    supabase.from("trip_members").select("*").eq("trip_id", access.trip.id),
  ]);

  return (
    <div className="max-w-xl">
      <PageHeader title="Packing list" subtitle="A shared checklist for the trip" />
      <PackingPanel code={code} initialItems={(items ?? []) as PackingItem[]} members={(members ?? []) as TripMember[]} />
    </div>
  );
}

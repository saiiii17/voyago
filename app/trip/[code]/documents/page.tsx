import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { DocumentsPanel } from "@/components/trip/DocumentsPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import type { TripDocument } from "@/lib/types/database";

export default async function DocumentsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const { data } = await supabase
    .from("trip_documents")
    .select("*")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-xl">
      <PageHeader title="Trip documents" subtitle="Tickets, bookings, and other paperwork" />
      <DocumentsPanel code={code} initialDocuments={(data ?? []) as TripDocument[]} />
    </div>
  );
}

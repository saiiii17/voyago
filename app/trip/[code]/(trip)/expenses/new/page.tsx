import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "@/components/trip/ExpenseForm";
import { PageHeader } from "@/components/ui/PageHeader";
import type { TripMember } from "@/lib/types/database";

export default async function NewExpensePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("trip_members")
    .select("*")
    .eq("trip_id", access.trip.id)
    .order("joined_at", { ascending: true });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Add expense" subtitle="Scan a receipt or enter it manually" />
      <ExpenseForm code={code} members={(members ?? []) as TripMember[]} homeCurrency={access.trip.home_currency} />
    </div>
  );
}

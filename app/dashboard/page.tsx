import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Trip } from "@/lib/types/database";

export default async function DashboardPage() {
  const profile = await requireProfile();
  if (!profile.is_master) redirect("/");

  const supabase = await createClient();
  const { data: trips } = await supabase.from("trips").select("*").order("created_at", { ascending: false });

  const tripStats = await Promise.all(
    ((trips ?? []) as Trip[]).map(async (trip) => {
      const [{ count: memberCount }, { data: expenses }] = await Promise.all([
        supabase.from("trip_members").select("id", { count: "exact", head: true }).eq("trip_id", trip.id),
        supabase.from("expenses").select("total_amount, fx_rate_to_home").eq("trip_id", trip.id),
      ]);
      const totalSpend = (expenses ?? []).reduce((sum, e) => sum + e.total_amount * e.fx_rate_to_home, 0);
      return { trip, memberCount: memberCount ?? 0, totalSpend };
    })
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader title="✨ Master dashboard" subtitle="Every trip in the app, across every friend group" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white">
          <p className="text-sm text-brand-100">Trips</p>
          <p className="text-3xl font-semibold tracking-tight">{tripStats.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Total members (all trips)</p>
          <p className="text-3xl font-semibold tracking-tight text-stone-900">
            {tripStats.reduce((sum, t) => sum + t.memberCount, 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Trips this year</p>
          <p className="text-3xl font-semibold tracking-tight text-stone-900">
            {tripStats.filter((t) => new Date(t.trip.created_at).getFullYear() === new Date().getFullYear()).length}
          </p>
        </Card>
      </div>

      <div className="space-y-2">
        {tripStats.map(({ trip, memberCount, totalSpend }) => (
          <Link key={trip.id} href={`/trip/${trip.code}`}>
            <Card className="flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-lg">
                  🌍
                </span>
                <div>
                  <p className="font-medium text-stone-900">{trip.name}</p>
                  <p className="text-xs text-stone-500">
                    {trip.destination} · {memberCount} member{memberCount === 1 ? "" : "s"} · {formatDate(trip.created_at)}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-stone-900">{formatCurrency(totalSpend, trip.home_currency)}</span>
            </Card>
          </Link>
        ))}
        {tripStats.length === 0 && (
          <Card>
            <p className="text-sm text-stone-500">No trips yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

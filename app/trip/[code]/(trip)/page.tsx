import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { getTripBalances } from "@/lib/trip-data";
import { BalanceSummary } from "@/components/trip/BalanceSummary";
import { CategoryChart } from "@/components/trip/CategoryChart";
import { WeatherWidget } from "@/components/trip/WeatherWidget";
import { TripQRCode } from "@/components/trip/TripQRCode";
import { JoinRequestsPanel } from "@/components/trip/JoinRequestsPanel";
import { MembersPanel } from "@/components/trip/MembersPanel";
import { CurrencyConvertWidget } from "@/components/trip/CurrencyConvertWidget";
import type { ExpenseCategory } from "@/lib/types/database";

export default async function TripOverviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const [{ members, balances, settlementSuggestions }, { data: expenses }, pendingRequests] = await Promise.all([
    getTripBalances(access.trip.id),
    supabase.from("expenses").select("category, total_amount, fx_rate_to_home").eq("trip_id", access.trip.id),
    access.canManage
      ? supabase
          .from("join_requests")
          .select("id, requested_at, profiles(display_name, email)")
          .eq("trip_id", access.trip.id)
          .eq("status", "pending")
          .order("requested_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const spendByCategory: Partial<Record<ExpenseCategory, number>> = {};
  for (const e of expenses ?? []) {
    const key = e.category as ExpenseCategory;
    spendByCategory[key] = (spendByCategory[key] ?? 0) + e.total_amount * e.fx_rate_to_home;
  }

  return (
    <div className="space-y-6">
      {access.canManage && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <JoinRequestsPanel code={code} requests={(pendingRequests.data ?? []) as any} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <WeatherWidget
          code={code}
          destination={access.trip.destination}
          weatherCity={access.trip.weather_city}
          canEdit={access.canManage}
        />
        <CurrencyConvertWidget defaultFrom="USD" defaultTo={access.trip.home_currency} />
      </div>

      {access.canManage && <TripQRCode code={code} />}
      {access.canManage && <MembersPanel code={code} members={members} ownerId={access.trip.owner_id} />}

      <CategoryChart homeCurrency={access.trip.home_currency} spendByCategory={spendByCategory} />

      <BalanceSummary
        code={code}
        homeCurrency={access.trip.home_currency}
        balances={balances}
        suggestions={settlementSuggestions}
        members={members}
      />
    </div>
  );
}

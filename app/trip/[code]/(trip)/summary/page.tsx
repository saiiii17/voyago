import { requireTripPageAccess } from "@/lib/auth-page";
import { getTripBalances } from "@/lib/trip-data";
import { SummaryExport } from "@/components/trip/SummaryExport";
import { DebtBreakdown } from "@/components/trip/DebtBreakdown";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function SummaryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const { balances, settlementSuggestions, rawPairwiseDebts } = await getTripBalances(access.trip.id);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <PageHeader title="Trip summary" subtitle="Share the final totals with the group" />
        <SummaryExport
          tripName={access.trip.name}
          destination={access.trip.destination}
          homeCurrency={access.trip.home_currency}
          balances={balances}
          suggestions={settlementSuggestions}
        />
      </div>

      <DebtBreakdown
        homeCurrency={access.trip.home_currency}
        balances={balances}
        rawDebts={rawPairwiseDebts}
        suggestions={settlementSuggestions}
      />
    </div>
  );
}

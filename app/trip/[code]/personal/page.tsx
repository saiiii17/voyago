import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { PersonalExpensesPanel } from "@/components/trip/PersonalExpensesPanel";
import { BudgetForm } from "@/components/trip/BudgetForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import type { PersonalExpense } from "@/lib/types/database";

export default async function PersonalExpensesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const { data } = access.member
    ? await supabase
        .from("personal_expenses")
        .select("*")
        .eq("trip_id", access.trip.id)
        .eq("trip_member_id", access.member.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Your personal costs" subtitle="Solo spend that isn't split with the group" />
      {!access.member ? (
        <Card>
          <p className="text-sm text-stone-500">
            You&apos;re viewing as master/owner without a trip membership — join the trip as a member to log personal costs.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <BudgetForm code={code} member={access.member} homeCurrency={access.trip.home_currency} />
          <PersonalExpensesPanel
            code={code}
            homeCurrency={access.trip.home_currency}
            initialExpenses={(data ?? []) as PersonalExpense[]}
          />
        </div>
      )}
    </div>
  );
}

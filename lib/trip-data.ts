import { createClient } from "@/lib/supabase/server";
import { fetchExpenseInputs } from "@/lib/split/fetch";
import { calculateBalances } from "@/lib/split/balances";
import { applyPaidSettlements, simplifyDebts } from "@/lib/split/settle";
import { calculateRawPairwiseDebts } from "@/lib/split/pairwise";
import type { Settlement, TripMember } from "@/lib/types/database";

export async function getTripBalances(tripId: string) {
  const supabase = await createClient();

  const [{ data: members }, expenseInputs, { data: personalExpenses }, { data: paidSettlements }] =
    await Promise.all([
      supabase.from("trip_members").select("*").eq("trip_id", tripId),
      fetchExpenseInputs(tripId),
      supabase
        .from("personal_expenses")
        .select("trip_member_id, amount, fx_rate_to_home")
        .eq("trip_id", tripId),
      supabase.from("settlements").select("*").eq("trip_id", tripId).eq("status", "paid").order("paid_at", {
        ascending: false,
      }),
    ]);

  const memberList = (members ?? []) as TripMember[];

  const { balances, expenseBreakdowns } = calculateBalances({
    members: memberList.map((m) => ({ id: m.id, displayName: m.display_name })),
    expenses: expenseInputs,
    personalExpenses: (personalExpenses ?? []).map((p) => ({
      tripMemberId: p.trip_member_id,
      amount: p.amount,
      fxRateToHome: p.fx_rate_to_home,
    })),
  });

  const paid = (paidSettlements ?? []) as Settlement[];
  const netted = applyPaidSettlements(
    balances,
    paid.map((s) => ({ fromMember: s.from_member, toMember: s.to_member, amount: s.amount }))
  );
  const settlementSuggestions = simplifyDebts(
    netted.map((b) => ({ tripMemberId: b.tripMemberId, netBalance: b.netBalance }))
  );
  const rawPairwiseDebts = calculateRawPairwiseDebts(expenseInputs, expenseBreakdowns);

  return {
    members: memberList,
    balances,
    expenseBreakdowns,
    settlementSuggestions,
    paidSettlements: paid,
    rawPairwiseDebts,
  };
}

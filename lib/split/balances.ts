import { calculateExpenseBreakdown } from "./calculate";
import type { ExpenseBreakdown, ExpenseInput, MemberBalance } from "./types";

export interface BalancesInput {
  members: { id: string; displayName: string }[];
  expenses: ExpenseInput[];
  personalExpenses: { tripMemberId: string; amount: number; fxRateToHome: number }[];
}

export interface BalancesResult {
  balances: MemberBalance[];
  expenseBreakdowns: ExpenseBreakdown[];
}

/** Aggregates every expense + personal cost in a trip into a per-member balance sheet. */
export function calculateBalances(input: BalancesInput): BalancesResult {
  const paid = new Map<string, number>();
  const consumed = new Map<string, number>();
  const personal = new Map<string, number>();
  const expenseBreakdowns: ExpenseBreakdown[] = [];

  for (const expense of input.expenses) {
    const breakdown = calculateExpenseBreakdown(expense);
    expenseBreakdowns.push(breakdown);

    paid.set(expense.paidBy, (paid.get(expense.paidBy) ?? 0) + expense.totalAmount * expense.fxRateToHome);

    for (const m of breakdown.perMember) {
      consumed.set(m.tripMemberId, (consumed.get(m.tripMemberId) ?? 0) + m.totalHomeCurrency);
    }
  }

  for (const p of input.personalExpenses) {
    personal.set(p.tripMemberId, (personal.get(p.tripMemberId) ?? 0) + p.amount * p.fxRateToHome);
  }

  const balances = input.members.map((m): MemberBalance => {
    const totalPaid = paid.get(m.id) ?? 0;
    const totalConsumed = consumed.get(m.id) ?? 0;
    const personalSpend = personal.get(m.id) ?? 0;
    return {
      tripMemberId: m.id,
      displayName: m.displayName,
      totalPaid,
      totalConsumed,
      personalSpend,
      totalTripCost: totalConsumed + personalSpend,
      netBalance: totalPaid - totalConsumed,
    };
  });

  return { balances, expenseBreakdowns };
}

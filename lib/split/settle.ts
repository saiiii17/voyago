import type { MemberBalance, SettlementSuggestion } from "./types";

const EPSILON = 0.01;

/**
 * Greedy min-transaction debt simplification: repeatedly matches the
 * largest creditor with the largest debtor so the group ends up with as
 * few payments as possible, instead of everyone paying everyone.
 */
export function simplifyDebts(netBalances: { tripMemberId: string; netBalance: number }[]): SettlementSuggestion[] {
  const creditors = netBalances
    .filter((b) => b.netBalance > EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.netBalance - a.netBalance);

  const debtors = netBalances
    .filter((b) => b.netBalance < -EPSILON)
    .map((b) => ({ tripMemberId: b.tripMemberId, netBalance: -b.netBalance }))
    .sort((a, b) => b.netBalance - a.netBalance);

  const suggestions: SettlementSuggestion[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.netBalance, creditor.netBalance);

    if (amount > EPSILON) {
      suggestions.push({
        fromMemberId: debtor.tripMemberId,
        toMemberId: creditor.tripMemberId,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.netBalance -= amount;
    creditor.netBalance -= amount;
    if (debtor.netBalance <= EPSILON) i++;
    if (creditor.netBalance <= EPSILON) j++;
  }

  return suggestions;
}

/**
 * Nets already-marked-paid settlements out of the raw balances before
 * suggesting new ones, so a debt that's been settled in real life doesn't
 * keep getting suggested. Paying down a debt moves both parties toward
 * zero regardless of which specific pairing gets suggested next time.
 */
export function applyPaidSettlements(
  balances: MemberBalance[],
  paidSettlements: { fromMember: string; toMember: string; amount: number }[]
): MemberBalance[] {
  const adjustment = new Map<string, number>();
  for (const s of paidSettlements) {
    adjustment.set(s.fromMember, (adjustment.get(s.fromMember) ?? 0) + s.amount);
    adjustment.set(s.toMember, (adjustment.get(s.toMember) ?? 0) - s.amount);
  }

  return balances.map((b) => ({
    ...b,
    netBalance: b.netBalance + (adjustment.get(b.tripMemberId) ?? 0),
  }));
}

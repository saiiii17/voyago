import type { ExpenseBreakdown, ExpenseInput, ItemBreakdown, MemberExpenseBreakdown } from "./types";

/**
 * The core split engine: turns one expense's items + who-shared-what into a
 * full, itemized, per-member breakdown. Tax/tip/discount are allocated to
 * each member proportionally to what they actually consumed, not split
 * evenly across the whole group.
 */
export function calculateExpenseBreakdown(expense: ExpenseInput): ExpenseBreakdown {
  const memberSubtotals = new Map<string, number>();

  const items: ItemBreakdown[] = expense.items.map((item) => {
    const lineTotal = item.unitPrice * item.quantity;
    const totalWeight = item.shares.reduce((sum, s) => sum + s.weight, 0);

    const sharedBy = item.shares.map((s) => {
      const cost = totalWeight > 0 ? (lineTotal * s.weight) / totalWeight : 0;
      memberSubtotals.set(s.tripMemberId, (memberSubtotals.get(s.tripMemberId) ?? 0) + cost);
      return { tripMemberId: s.tripMemberId, weight: s.weight, cost };
    });

    return {
      itemId: item.id,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal,
      sharedBy,
    };
  });

  // Derived from the items, not the header subtotal field — self-corrects
  // if what was typed/scanned for subtotal doesn't quite match the items.
  const subtotal = Array.from(memberSubtotals.values()).reduce((a, b) => a + b, 0);

  const perMember: MemberExpenseBreakdown[] = Array.from(memberSubtotals.entries()).map(
    ([tripMemberId, memberSubtotal]) => {
      const proportion = subtotal > 0 ? memberSubtotal / subtotal : 0;
      const taxShare = expense.taxAmount * proportion;
      const tipShare = expense.tipAmount * proportion;
      const discountShare = expense.discountAmount * proportion;
      const total = memberSubtotal + taxShare + tipShare - discountShare;

      return {
        tripMemberId,
        subtotal: memberSubtotal,
        taxShare,
        tipShare,
        discountShare,
        total,
        totalHomeCurrency: total * expense.fxRateToHome,
      };
    }
  );

  return {
    expenseId: expense.id,
    currency: expense.currency,
    fxRateToHome: expense.fxRateToHome,
    subtotal,
    items,
    perMember,
  };
}

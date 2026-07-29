export interface ItemShareInput {
  tripMemberId: string;
  weight: number;
}

export interface ItemInput {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  shares: ItemShareInput[];
}

export interface ExpenseInput {
  id: string;
  title: string;
  paidBy: string; // trip_member id
  currency: string;
  fxRateToHome: number;
  totalAmount: number; // header total actually charged — used for totalPaid
  taxAmount: number;
  tipAmount: number;
  discountAmount: number;
  items: ItemInput[];
}

export interface ItemBreakdown {
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  sharedBy: { tripMemberId: string; weight: number; cost: number }[];
}

export interface MemberExpenseBreakdown {
  tripMemberId: string;
  subtotal: number; // sum of their item shares, expense currency
  taxShare: number;
  tipShare: number;
  discountShare: number;
  total: number; // subtotal + tax + tip - discount, expense currency
  totalHomeCurrency: number;
}

export interface ExpenseBreakdown {
  expenseId: string;
  currency: string;
  fxRateToHome: number;
  subtotal: number; // derived sum of item costs — self-corrects vs. header entry
  items: ItemBreakdown[];
  perMember: MemberExpenseBreakdown[];
}

export interface MemberBalance {
  tripMemberId: string;
  displayName: string;
  totalPaid: number; // home currency — sum of expense.totalAmount where they paid
  totalConsumed: number; // home currency — sum of their itemized shares across expenses
  personalSpend: number; // home currency — solo, non-split costs
  totalTripCost: number; // totalConsumed + personalSpend — the full "what this trip cost me"
  netBalance: number; // totalPaid - totalConsumed (positive = owed money by the group)
}

export interface SettlementSuggestion {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

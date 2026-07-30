// Hand-written types matching supabase/schema.sql. If you have the Supabase
// CLI set up, you can replace this with `supabase gen types typescript` output
// once the project is linked — this file is structured to be a drop-in
// compatible shape for @supabase/ssr's generic client.

export type ExpenseCategory =
  | "food"
  | "transport"
  | "lodging"
  | "activities"
  | "shopping"
  | "other";

export type PlaceCategory = "food" | "attraction" | "lodging" | "transport" | "activity" | "other";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  is_master: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  code: string;
  name: string;
  destination: string;
  home_currency: string;
  weather_city: string | null;
  owner_id: string;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  trip_id: string;
  profile_id: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  decided_at: string | null;
}

export interface TripMember {
  id: string;
  trip_id: string;
  profile_id: string;
  display_name: string;
  budget_amount: number | null;
  budget_currency: string | null;
  joined_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  category: ExpenseCategory;
  paid_by: string;
  receipt_image_url: string | null;
  currency: string;
  fx_rate_to_home: number;
  subtotal: number;
  tax_amount: number;
  tip_amount: number;
  discount_amount: number;
  total_amount: number;
  split_mode: "itemized" | "equal";
  created_at: string;
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

export interface ExpenseItemShare {
  id: string;
  expense_item_id: string;
  trip_member_id: string;
  weight: number;
}

export interface PersonalExpense {
  id: string;
  trip_id: string;
  trip_member_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  fx_rate_to_home: number;
  created_at: string;
}

export interface TripPlace {
  id: string;
  trip_id: string;
  name: string;
  category: PlaceCategory;
  notes: string | null;
  estimated_cost: number | null;
  currency: string | null;
  status: "planned" | "visited" | "skipped";
  visit_date: string | null;
  added_by: string;
  created_at: string;
}

export interface TripDocument {
  id: string;
  trip_id: string;
  name: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  name: string;
  is_checked: boolean;
  assigned_to: string | null;
  added_by: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  trip_id: string;
  from_member: string;
  to_member: string;
  amount: number;
  currency: string;
  status: "pending" | "paid";
  paid_at: string | null;
  created_at: string;
}

// Minimal Database shape so @supabase/ssr's generic client typing is happy.
// Not a full generated schema (no Insert/Update/Relationships variants) —
// route handlers type request/response payloads explicitly instead.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip> };
      join_requests: { Row: JoinRequest; Insert: Partial<JoinRequest>; Update: Partial<JoinRequest> };
      trip_members: { Row: TripMember; Insert: Partial<TripMember>; Update: Partial<TripMember> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      expense_items: { Row: ExpenseItem; Insert: Partial<ExpenseItem>; Update: Partial<ExpenseItem> };
      expense_item_shares: {
        Row: ExpenseItemShare;
        Insert: Partial<ExpenseItemShare>;
        Update: Partial<ExpenseItemShare>;
      };
      personal_expenses: {
        Row: PersonalExpense;
        Insert: Partial<PersonalExpense>;
        Update: Partial<PersonalExpense>;
      };
      trip_places: { Row: TripPlace; Insert: Partial<TripPlace>; Update: Partial<TripPlace> };
      trip_documents: { Row: TripDocument; Insert: Partial<TripDocument>; Update: Partial<TripDocument> };
      packing_items: { Row: PackingItem; Insert: Partial<PackingItem>; Update: Partial<PackingItem> };
      settlements: { Row: Settlement; Insert: Partial<Settlement>; Update: Partial<Settlement> };
    };
  };
}

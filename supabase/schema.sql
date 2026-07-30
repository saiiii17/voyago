-- Trip Expenses — Supabase schema
-- Run this once in the Supabase SQL editor for a fresh project.
-- After you (the app's owner) sign up for the first time, run the one-time
-- "flag yourself as master" statement at the bottom of this file.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Tables
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  is_master boolean not null default false,
  created_at timestamptz not null default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  destination text not null,
  home_currency text not null default 'USD',
  weather_city text,
  owner_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table join_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (trip_id, profile_id)
);

create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  display_name text not null,
  budget_amount numeric,
  budget_currency text,
  joined_at timestamptz not null default now(),
  unique (trip_id, profile_id)
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  title text not null,
  category text not null default 'other'
    check (category in ('food', 'transport', 'lodging', 'activities', 'shopping', 'other')),
  paid_by uuid not null references trip_members (id) on delete cascade,
  receipt_image_url text,
  currency text not null,
  fx_rate_to_home numeric not null default 1,
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  tip_amount numeric not null default 0,
  discount_amount numeric not null default 0,
  total_amount numeric not null default 0,
  split_mode text not null default 'itemized' check (split_mode in ('itemized', 'equal')),
  created_at timestamptz not null default now()
);

create table expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses (id) on delete cascade,
  name text not null,
  unit_price numeric not null default 0,
  quantity numeric not null default 1
);

create table expense_item_shares (
  id uuid primary key default gen_random_uuid(),
  expense_item_id uuid not null references expense_items (id) on delete cascade,
  trip_member_id uuid not null references trip_members (id) on delete cascade,
  weight numeric not null default 1,
  unique (expense_item_id, trip_member_id)
);

create table personal_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  trip_member_id uuid not null references trip_members (id) on delete cascade,
  title text not null,
  category text not null default 'other'
    check (category in ('food', 'transport', 'lodging', 'activities', 'shopping', 'other')),
  amount numeric not null,
  currency text not null,
  fx_rate_to_home numeric not null default 1,
  created_at timestamptz not null default now()
);

create table trip_places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  category text not null default 'activity'
    check (category in ('food', 'attraction', 'lodging', 'transport', 'activity', 'other')),
  notes text,
  estimated_cost numeric,
  currency text,
  status text not null default 'planned' check (status in ('planned', 'visited', 'skipped')),
  visit_date date,
  added_by uuid not null references trip_members (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table trip_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  file_url text not null,
  uploaded_by uuid not null references trip_members (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  is_checked boolean not null default false,
  assigned_to uuid references trip_members (id) on delete set null,
  added_by uuid not null references trip_members (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  from_member uuid not null references trip_members (id) on delete cascade,
  to_member uuid not null references trip_members (id) on delete cascade,
  amount numeric not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index on trip_members (trip_id);
create index on expenses (trip_id);
create index on expense_items (expense_id);
create index on expense_item_shares (expense_item_id);
create index on personal_expenses (trip_id);
create index on trip_places (trip_id);
create index on trip_documents (trip_id);
create index on packing_items (trip_id);
create index on settlements (trip_id);
create index on join_requests (trip_id);

-- ============================================================================
-- Auto-create a profile row whenever a new auth user signs up
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS helper functions (security definer so they can read across tables
-- without recursively re-triggering RLS on the tables they check)
-- ============================================================================

create or replace function public.is_master(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_master from profiles where id = uid), false);
$$;

create or replace function public.is_trip_owner(t_id uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from trips where id = t_id and owner_id = uid);
$$;

create or replace function public.is_trip_visible(t_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.is_master(auth.uid())
    or public.is_trip_owner(t_id, auth.uid())
    or exists (
      select 1 from trip_members where trip_id = t_id and profile_id = auth.uid()
    );
$$;

create or replace function public.can_manage_trip(t_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_master(auth.uid()) or public.is_trip_owner(t_id, auth.uid());
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table trips enable row level security;
alter table join_requests enable row level security;
alter table trip_members enable row level security;
alter table expenses enable row level security;
alter table expense_items enable row level security;
alter table expense_item_shares enable row level security;
alter table personal_expenses enable row level security;
alter table trip_places enable row level security;
alter table trip_documents enable row level security;
alter table packing_items enable row level security;
alter table settlements enable row level security;

-- profiles: anyone signed in can read basic profile info (needed to show member
-- names); a user can only edit their own row.
create policy "profiles readable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles editable by owner" on profiles
  for update using (id = auth.uid());

-- trips (only the master account can create trips — everyone else joins as
-- a friend via invite link/QR and never sees the full trip list)
create policy "trips visible per role" on trips
  for select using (public.is_trip_visible(id));
create policy "trips insertable by master" on trips
  for insert with check (owner_id = auth.uid() and public.is_master(auth.uid()));
create policy "trips editable by owner or master" on trips
  for update using (public.can_manage_trip(id));
create policy "trips deletable by owner or master" on trips
  for delete using (public.can_manage_trip(id));

-- join_requests
create policy "join requests visible to requester or trip manager" on join_requests
  for select using (profile_id = auth.uid() or public.can_manage_trip(trip_id));
create policy "join requests insertable by requester" on join_requests
  for insert with check (profile_id = auth.uid());
create policy "join requests decided by trip manager" on join_requests
  for update using (public.can_manage_trip(trip_id));
-- Lets a requester re-request after a rejection (upsert resets status to
-- 'pending'). This does NOT grant trip access by itself — actual access is
-- gated separately by the trip_members insert policy (manager-only).
create policy "join requests re-requestable by requester" on join_requests
  for update using (profile_id = auth.uid());

-- trip_members
create policy "trip members visible per role" on trip_members
  for select using (public.is_trip_visible(trip_id));
create policy "trip members insertable by trip manager" on trip_members
  for insert with check (public.can_manage_trip(trip_id));
create policy "trip members updatable by self or manager" on trip_members
  for update using (profile_id = auth.uid() or public.can_manage_trip(trip_id));
create policy "trip members deletable by manager" on trip_members
  for delete using (public.can_manage_trip(trip_id));

-- expenses (any approved trip member can log/edit shared expenses)
create policy "expenses visible per role" on expenses
  for select using (public.is_trip_visible(trip_id));
create policy "expenses writable by trip members" on expenses
  for insert with check (public.is_trip_visible(trip_id));
create policy "expenses updatable by trip members" on expenses
  for update using (public.is_trip_visible(trip_id));
create policy "expenses deletable by trip members" on expenses
  for delete using (public.is_trip_visible(trip_id));

-- expense_items / expense_item_shares (resolve trip_id via expenses)
create policy "expense items visible per role" on expense_items
  for select using (
    exists (select 1 from expenses e where e.id = expense_id and public.is_trip_visible(e.trip_id))
  );
create policy "expense items writable by trip members" on expense_items
  for insert with check (
    exists (select 1 from expenses e where e.id = expense_id and public.is_trip_visible(e.trip_id))
  );
create policy "expense items updatable by trip members" on expense_items
  for update using (
    exists (select 1 from expenses e where e.id = expense_id and public.is_trip_visible(e.trip_id))
  );
create policy "expense items deletable by trip members" on expense_items
  for delete using (
    exists (select 1 from expenses e where e.id = expense_id and public.is_trip_visible(e.trip_id))
  );

create policy "expense item shares visible per role" on expense_item_shares
  for select using (
    exists (
      select 1 from expense_items i join expenses e on e.id = i.expense_id
      where i.id = expense_item_id and public.is_trip_visible(e.trip_id)
    )
  );
create policy "expense item shares writable by trip members" on expense_item_shares
  for insert with check (
    exists (
      select 1 from expense_items i join expenses e on e.id = i.expense_id
      where i.id = expense_item_id and public.is_trip_visible(e.trip_id)
    )
  );
create policy "expense item shares updatable by trip members" on expense_item_shares
  for update using (
    exists (
      select 1 from expense_items i join expenses e on e.id = i.expense_id
      where i.id = expense_item_id and public.is_trip_visible(e.trip_id)
    )
  );
create policy "expense item shares deletable by trip members" on expense_item_shares
  for delete using (
    exists (
      select 1 from expense_items i join expenses e on e.id = i.expense_id
      where i.id = expense_item_id and public.is_trip_visible(e.trip_id)
    )
  );

-- personal_expenses (private to the member who logged them, plus trip manager)
create policy "personal expenses visible to owner or manager" on personal_expenses
  for select using (
    exists (select 1 from trip_members m where m.id = trip_member_id and m.profile_id = auth.uid())
    or public.can_manage_trip(trip_id)
  );
create policy "personal expenses insertable by self" on personal_expenses
  for insert with check (
    exists (select 1 from trip_members m where m.id = trip_member_id and m.profile_id = auth.uid())
  );
create policy "personal expenses updatable by self" on personal_expenses
  for update using (
    exists (select 1 from trip_members m where m.id = trip_member_id and m.profile_id = auth.uid())
  );
create policy "personal expenses deletable by self" on personal_expenses
  for delete using (
    exists (select 1 from trip_members m where m.id = trip_member_id and m.profile_id = auth.uid())
  );

-- trip_places / trip_documents / packing_items (collaborative, any trip member)
create policy "places visible per role" on trip_places
  for select using (public.is_trip_visible(trip_id));
create policy "places writable by trip members" on trip_places
  for insert with check (public.is_trip_visible(trip_id));
create policy "places updatable by trip members" on trip_places
  for update using (public.is_trip_visible(trip_id));
create policy "places deletable by trip members" on trip_places
  for delete using (public.is_trip_visible(trip_id));

create policy "documents visible per role" on trip_documents
  for select using (public.is_trip_visible(trip_id));
create policy "documents writable by trip members" on trip_documents
  for insert with check (public.is_trip_visible(trip_id));
create policy "documents deletable by trip members" on trip_documents
  for delete using (public.is_trip_visible(trip_id));

create policy "packing items visible per role" on packing_items
  for select using (public.is_trip_visible(trip_id));
create policy "packing items writable by trip members" on packing_items
  for insert with check (public.is_trip_visible(trip_id));
create policy "packing items updatable by trip members" on packing_items
  for update using (public.is_trip_visible(trip_id));
create policy "packing items deletable by trip members" on packing_items
  for delete using (public.is_trip_visible(trip_id));

-- settlements (visible to the trip; either party or a manager can mark paid)
create policy "settlements visible per role" on settlements
  for select using (public.is_trip_visible(trip_id));
create policy "settlements writable by trip manager" on settlements
  for insert with check (public.is_trip_visible(trip_id));
create policy "settlements updatable by involved member or manager" on settlements
  for update using (
    public.can_manage_trip(trip_id)
    or exists (select 1 from trip_members m where m.id in (from_member, to_member) and m.profile_id = auth.uid())
  );
create policy "settlements deletable by involved member or manager" on settlements
  for delete using (
    public.can_manage_trip(trip_id)
    or exists (select 1 from trip_members m where m.id in (from_member, to_member) and m.profile_id = auth.uid())
  );

-- ============================================================================
-- Storage buckets
-- Uploads (receipts, trip documents) always go through server-side Route
-- Handlers using the service-role key, so we don't need authenticated INSERT
-- policies on storage.objects. Both buckets are public-read: URLs are
-- unguessable (uuid-prefixed paths) and this keeps next/image + <img> simple.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('trip-documents', 'trip-documents', true)
on conflict (id) do nothing;

-- ============================================================================
-- One-time setup step — run this AFTER you've signed up in the app at least
-- once, so your profile row exists. Replace the email.
-- ============================================================================

-- update profiles set is_master = true where email = 'saishanmat417@gmail.com';

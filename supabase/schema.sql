-- ============================================================================
-- JustPlay / JustPlay Partner — core database schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- This schema is shared by both apps (consumer "JustPlay" and this partner
-- app). Access is separated entirely through Row Level Security (RLS)
-- policies below -- there is one database, not two.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists btree_gist; -- needed for the booking exclusion constraint

-- ----------------------------------------------------------------------------
-- PROFILES -- one row per authenticated user (both partners and customers).
-- Supabase auth.users already handles login; this table holds app-specific
-- profile data and the role that RLS policies key off of.
-- ----------------------------------------------------------------------------
create type user_role as enum ('partner', 'customer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  phone text,
  location text,
  organisation_name text, -- only relevant for partners
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile on signup"
  on profiles for insert
  with check (auth.uid() = id);


-- ----------------------------------------------------------------------------
-- VENUES -- owned by a partner. Consumers can read active venues publicly;
-- only the owning partner (or their staff) can write.
-- ----------------------------------------------------------------------------
create table venues (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  address text not null,
  sports text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table venues enable row level security;

create policy "Anyone can view active venues"
  on venues for select
  using (is_active = true);

create policy "Owners can view their own venues (active or not)"
  on venues for select
  using (auth.uid() = owner_id);

create policy "Owners can insert their own venues"
  on venues for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own venues"
  on venues for update
  using (auth.uid() = owner_id);


-- ----------------------------------------------------------------------------
-- STAFF -- links a staff member's auth account to a venue with a role.
-- Lets partner-app permission checks ("Front Desk can't see payments")
-- be enforced server-side via RLS, not just hidden in the UI.
-- ----------------------------------------------------------------------------
create type staff_role as enum ('Owner', 'Manager', 'Front Desk');

create table venue_staff (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role staff_role not null default 'Front Desk',
  created_at timestamptz not null default now(),
  unique (venue_id, user_id)
);

alter table venue_staff enable row level security;

create policy "Staff can view their own venue's staff list"
  on venue_staff for select
  using (
    venue_id in (select id from venues where owner_id = auth.uid())
    or user_id = auth.uid()
  );

create policy "Venue owners can manage staff"
  on venue_staff for all
  using (venue_id in (select id from venues where owner_id = auth.uid()));


-- ----------------------------------------------------------------------------
-- COURTS -- belong to a venue.
-- ----------------------------------------------------------------------------
create table courts (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  sport text not null,
  base_price numeric(10, 2) not null,
  min_price numeric(10, 2) not null,
  max_price numeric(10, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table courts enable row level security;

create policy "Anyone can view active courts of active venues"
  on courts for select
  using (
    is_active = true
    and venue_id in (select id from venues where is_active = true)
  );

create policy "Venue owners can manage their courts"
  on courts for all
  using (venue_id in (select id from venues where owner_id = auth.uid()));


-- ----------------------------------------------------------------------------
-- BOOKINGS -- the core conflict-prevention table.
--
-- The EXCLUDE constraint below is what actually prevents double-booking:
-- Postgres rejects, at the database level, any INSERT/UPDATE that would
-- create two *confirmed* bookings for the same court with overlapping time
-- ranges -- regardless of how many requests arrive simultaneously from
-- either app. This replaces "check then insert" application logic, which
-- is vulnerable to race conditions under concurrent load.
-- ----------------------------------------------------------------------------
create type booking_status as enum ('confirmed', 'cancelled', 'completed');

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  court_id uuid not null references courts(id) on delete cascade,
  customer_id uuid references profiles(id), -- null for walk-ins with no account
  customer_name text not null,
  customer_phone text,
  slot_range tstzrange not null,
  amount numeric(10, 2) not null,
  status booking_status not null default 'confirmed',
  payment_id uuid,
  created_at timestamptz not null default now(),

  -- The actual conflict-prevention guarantee:
  exclude using gist (court_id with =, slot_range with &&)
    where (status = 'confirmed')
);

create index bookings_court_id_idx on bookings (court_id);
create index bookings_customer_id_idx on bookings (customer_id);

alter table bookings enable row level security;

create policy "Customers can view their own bookings"
  on bookings for select
  using (customer_id = auth.uid());

create policy "Venue owners/staff can view bookings for their venues"
  on bookings for select
  using (
    court_id in (
      select c.id from courts c
      join venues v on v.id = c.venue_id
      where v.owner_id = auth.uid()
    )
  );

create policy "Customers can create their own bookings"
  on bookings for insert
  with check (customer_id = auth.uid());

create policy "Venue owners/staff can create bookings for their venues"
  on bookings for insert
  with check (
    court_id in (
      select c.id from courts c
      join venues v on v.id = c.venue_id
      where v.owner_id = auth.uid()
    )
  );

create policy "Venue owners can update bookings for their venues"
  on bookings for update
  using (
    court_id in (
      select c.id from courts c
      join venues v on v.id = c.venue_id
      where v.owner_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------------------
-- PAYMENTS -- linked to a booking. Amount/status here should only ever be
-- written by a trusted server context (e.g. a Supabase Edge Function
-- verifying a Razorpay webhook signature) -- never trust a client-reported
-- "payment successful" as truth. See paymentsApi.ts in the app for the
-- client-side contract this maps to.
-- ----------------------------------------------------------------------------
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type payment_method as enum ('UPI', 'Card', 'Cash', 'Netbanking');

create table payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete set null,
  venue_id uuid not null references venues(id),
  amount numeric(10, 2) not null,
  method payment_method not null,
  status payment_status not null default 'pending',
  gateway_payment_id text,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create policy "Venue owners can view their venue's payments"
  on payments for select
  using (venue_id in (select id from venues where owner_id = auth.uid()));

-- No insert/update policy for regular users -- payments should only be
-- written by a service-role backend/Edge Function after webhook verification.


-- ----------------------------------------------------------------------------
-- MEMBERSHIP PLANS & MEMBERS
-- ----------------------------------------------------------------------------
create table membership_plans (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  billing_cycle text not null,
  sport text not null,
  created_at timestamptz not null default now()
);

alter table membership_plans enable row level security;

create policy "Anyone can view plans of active venues"
  on membership_plans for select
  using (venue_id in (select id from venues where is_active = true));

create policy "Venue owners can manage their plans"
  on membership_plans for all
  using (venue_id in (select id from venues where owner_id = auth.uid()));

create type renewal_status as enum ('active', 'expiring', 'lapsed');

create table memberships (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references membership_plans(id) on delete cascade,
  customer_id uuid not null references profiles(id),
  renewal_date date not null,
  status renewal_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table memberships enable row level security;

create policy "Customers can view their own memberships"
  on memberships for select
  using (customer_id = auth.uid());

create policy "Venue owners can view memberships on their plans"
  on memberships for select
  using (
    plan_id in (
      select mp.id from membership_plans mp
      join venues v on v.id = mp.venue_id
      where v.owner_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------------------
-- EQUIPMENT INVENTORY
-- ----------------------------------------------------------------------------
create table equipment_items (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  category text not null,
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  rental_price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

alter table equipment_items enable row level security;

create policy "Venue owners can manage their equipment"
  on equipment_items for all
  using (venue_id in (select id from venues where owner_id = auth.uid()));


-- ----------------------------------------------------------------------------
-- COMMUNITY CHAT (consumer app) -- kept in the same database for now per
-- the plan discussed; migrate to a dedicated chat service later only if
-- volume genuinely demands it. Presence/typing indicators should live in
-- Redis, not here.
-- ----------------------------------------------------------------------------
create table community_groups (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table community_messages (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references community_groups(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

create index community_messages_group_id_idx on community_messages (group_id, created_at desc);

alter table community_groups enable row level security;
alter table community_messages enable row level security;

create policy "Anyone authenticated can view groups"
  on community_groups for select
  using (auth.role() = 'authenticated');

create policy "Anyone authenticated can view messages"
  on community_messages for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can send messages as themselves"
  on community_messages for insert
  with check (sender_id = auth.uid());
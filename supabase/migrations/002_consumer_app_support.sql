-- ============================================================================
-- Migration 002 — Consumer app support
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- Safe to run against your live DB: only ADDs columns/tables/functions.
-- Nothing here drops or alters existing data.
--
-- What this adds:
--   1. venues: optional consumer-facing fields (city, area, geo, photos)
--   2. venue_amenities table (Flood Lights, Parking, etc.)
--   3. reviews table (rating + comment per venue)
--   4. get_available_slots() — lets the consumer app check court
--      availability without being able to read other customers' bookings
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. venues — new optional columns
-- All nullable so nothing breaks for venues that haven't filled them in yet.
-- The Partner app's "Add Venue" form can be extended later to collect these;
-- until then they'll just be null and the consumer app should handle that.
-- ----------------------------------------------------------------------------
alter table venues
  add column if not exists city text,
  add column if not exists area text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists cover_image_urls text[] not null default '{}';


-- ----------------------------------------------------------------------------
-- 1b. courts — optional consumer-facing display fields
-- The Partner app's "Add/Edit Court" form doesn't collect these today;
-- they're nullable, so the consumer app must fall back sensibly when empty
-- (e.g. a placeholder image, hide the format/surface line if null).
-- ----------------------------------------------------------------------------
alter table courts
  add column if not exists image_url text,
  add column if not exists format text,        -- e.g. '5v5', '7v7', 'Box Cricket'
  add column if not exists surface_type text,   -- e.g. 'Synthetic Grass', 'Hard Court'
  add column if not exists is_popular boolean not null default false;


-- ----------------------------------------------------------------------------
-- 2. VENUE AMENITIES
-- ----------------------------------------------------------------------------
create table if not exists venue_amenities (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  icon text, -- e.g. 'lightbulb-outline', matches MaterialCommunityIcons names used by consumer app
  created_at timestamptz not null default now()
);

alter table venue_amenities enable row level security;

create policy "Anyone can view amenities of active venues"
  on venue_amenities for select
  using (venue_id in (select id from venues where is_active = true));

create policy "Venue owners can manage their amenities"
  on venue_amenities for all
  using (venue_id in (select id from venues where owner_id = auth.uid()));


-- ----------------------------------------------------------------------------
-- 3. REVIEWS
-- ----------------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  customer_id uuid references profiles(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_venue_id_idx on reviews (venue_id, created_at desc);

alter table reviews enable row level security;

create policy "Anyone can view reviews of active venues"
  on reviews for select
  using (venue_id in (select id from venues where is_active = true));

create policy "Customers can create their own reviews"
  on reviews for insert
  with check (customer_id = auth.uid());

create policy "Customers can update their own reviews"
  on reviews for update
  using (customer_id = auth.uid());

create policy "Customers can delete their own reviews"
  on reviews for delete
  using (customer_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 4. AVAILABILITY LOOKUP — get_available_slots()
--
-- Consumers must NOT be able to select from `bookings` directly (that table's
-- RLS correctly restricts rows to the customer's own bookings or the venue's
-- own staff — it exposes customer_name/phone). But consumers DO need to know
-- which hourly slots are free on a given court/day.
--
-- This function runs as SECURITY DEFINER (bypasses RLS internally) but only
-- ever returns a boolean per slot — never any booking/customer details — so
-- it's safe to expose to anon/authenticated users.
--
-- Mirrors the exact hourly-grid logic the Partner app already uses in
-- fetchDaySlots() (bookingsService.ts), so both apps agree on what an
-- "hour slot" is.
-- ----------------------------------------------------------------------------
create or replace function get_available_slots(p_court_id uuid, p_date date)
returns table(slot_start timestamptz, slot_end timestamptz, is_available boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opening time;
  v_closing time;
  v_open_hour int;
  v_close_hour int;
  v_hour int;
begin
  select opening_time, closing_time into v_opening, v_closing
  from courts
  where id = p_court_id and is_active = true;

  if v_opening is null then
    return; -- unknown/inactive court -> no slots
  end if;

  v_open_hour := extract(hour from v_opening)::int;
  v_close_hour := extract(hour from v_closing)::int;

  for v_hour in v_open_hour .. (v_close_hour - 1) loop
    slot_start := (p_date::text || ' ' || lpad(v_hour::text, 2, '0') || ':00:00')::timestamptz;
    slot_end := slot_start + interval '1 hour';
    is_available := not exists (
      select 1 from bookings b
      where b.court_id = p_court_id
        and b.status = 'confirmed'
        and b.slot_range && tstzrange(slot_start, slot_end)
    );
    return next;
  end loop;
end;
$$;

-- Anyone (including anonymous browsing) can call this to check availability.
grant execute on function get_available_slots(uuid, date) to anon, authenticated;
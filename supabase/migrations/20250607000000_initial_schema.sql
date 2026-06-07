-- ============================================================
-- FINDLEY LAKE — Initial Schema
-- ============================================================

-- ENUMS

create type user_role as enum ('papa', 'principal', 'viewer');

create type family_branch as enum (
  'Grandma and Papa',
  'Smoothie and Lynn',
  'Tom and Moe',
  'Keke and Matt',
  'Dick and Colleen'
);

create type booking_type as enum (
  'exclusive_offseason',
  'exclusive_peak',
  'open_shared',
  'lastminute_guest'
);

create type booking_status as enum (
  'draft',
  'pending',
  'confirmed',
  'bumped',
  'cancelled'
);

create type season_type as enum ('peak', 'offseason');

create type conflict_status as enum ('open', 'resolved');

create type notification_type as enum (
  'exclusive_overlap',
  'papa_overlap',
  'conflict_deadline_3wk',
  'conflict_deadline_1wk',
  'post_lockin_cancellation',
  'waiver_bump',
  'booking_confirmed'
);


-- ============================================================
-- TABLES
-- ============================================================

-- USERS
-- id mirrors auth.users.id so we can join on it
create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  name         text not null,
  email        text not null unique,
  role         user_role not null default 'viewer',
  family_branch family_branch not null,
  created_at   timestamptz not null default now()
);

-- ROOMS
create table public.rooms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  bed_count     smallint not null check (bed_count > 0),
  max_occupancy smallint not null check (max_occupancy > 0),
  attributes    jsonb not null default '{}'
);

-- BOOKINGS
create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users (id) on delete cascade,
  start_date      date not null,
  end_date        date not null,
  booking_type    booking_type not null,
  status          booking_status not null default 'draft',
  season          season_type not null,
  rooms_requested uuid[] not null default '{}',  -- array of room ids
  guest_count     smallint not null default 0 check (guest_count >= 0),
  waiver_eligible boolean not null generated always as (
    booking_type in ('open_shared', 'lastminute_guest')
  ) stored,
  notes           text,
  created_at      timestamptz not null default now(),
  constraint end_after_start check (end_date > start_date)
);

create index bookings_user_id_idx     on public.bookings (user_id);
create index bookings_date_range_idx  on public.bookings using gist (daterange(start_date, end_date, '[]'));
create index bookings_status_idx      on public.bookings (status);

-- SLEEP ASSIGNMENTS
create table public.sleep_assignments (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references public.bookings (id) on delete cascade,
  room_id         uuid not null references public.rooms (id) on delete cascade,
  assigned_guests jsonb not null default '[]',  -- [{name, relationship}]
  created_at      timestamptz not null default now(),
  unique (booking_id, room_id)
);

-- INTERESTS
create table public.interests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users (id) on delete cascade,
  week_start_date date not null,
  created_at      timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create index interests_week_idx on public.interests (week_start_date);

-- WAIVER SCORES
create table public.waiver_scores (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  score          numeric(10, 2) not null default 0,
  nights_ttm     integer not null default 0,
  requests_ttm   integer not null default 0,
  calculated_at  timestamptz not null default now()
);

create index waiver_scores_user_idx on public.waiver_scores (user_id, calculated_at desc);

-- CONFLICTS
create table public.conflicts (
  id            uuid primary key default gen_random_uuid(),
  booking_id_a  uuid not null references public.bookings (id) on delete cascade,
  booking_id_b  uuid not null references public.bookings (id) on delete cascade,
  status        conflict_status not null default 'open',
  resolved_by   uuid references public.users (id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  constraint no_self_conflict check (booking_id_a <> booking_id_b),
  unique (booking_id_a, booking_id_b)
);

-- NOTIFICATIONS
create table public.notifications (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users (id) on delete cascade,
  type      notification_type not null,
  payload   jsonb not null default '{}',
  sent_at   timestamptz,
  read_at   timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);


-- ============================================================
-- ROOM SEED DATA (6 bedrooms)
-- ============================================================

insert into public.rooms (name, bed_count, max_occupancy, attributes) values
  ('Master Suite',    1, 2, '{"floor": 2, "bathroom": "private", "bed_type": "king"}'),
  ('Lake Room',       1, 2, '{"floor": 2, "bathroom": "shared", "bed_type": "queen", "lake_view": true}'),
  ('Bunk Room',       2, 4, '{"floor": 2, "bathroom": "shared", "bed_type": "bunk", "notes": "2 bunk beds"}'),
  ('Garden Room',     1, 2, '{"floor": 1, "bathroom": "shared", "bed_type": "queen"}'),
  ('Loft Room',       1, 2, '{"floor": 3, "bathroom": "shared", "bed_type": "double"}'),
  ('Pullout Room',    1, 2, '{"floor": 1, "bathroom": "shared", "bed_type": "pullout_sofa", "notes": "flex space"}');


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users            enable row level security;
alter table public.rooms            enable row level security;
alter table public.bookings         enable row level security;
alter table public.sleep_assignments enable row level security;
alter table public.interests        enable row level security;
alter table public.waiver_scores    enable row level security;
alter table public.conflicts        enable row level security;
alter table public.notifications    enable row level security;


-- Helper function: get the role of the current user
create or replace function public.current_user_role()
returns user_role
language sql
security definer
stable
as $$
  select role from public.users where id = auth.uid();
$$;

-- Helper function: is current user an admin (papa or principal)?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select role in ('papa', 'principal') from public.users where id = auth.uid();
$$;


-- USERS policies
create policy "Users can read their own profile"
  on public.users for select
  using (id = auth.uid());

create policy "Admins can read all profiles"
  on public.users for select
  using (public.is_admin());

create policy "Users can update their own profile"
  on public.users for update
  using (id = auth.uid());


-- ROOMS policies
-- Everyone authenticated can see room info
create policy "Authenticated users can view rooms"
  on public.rooms for select
  using (auth.uid() is not null);


-- BOOKINGS policies

-- Viewers: confirmed bookings only, no filtering by room
create policy "Viewers see confirmed bookings only"
  on public.bookings for select
  using (
    public.current_user_role() = 'viewer'
    and status = 'confirmed'
  );

-- Principals: see confirmed bookings + their own pending/draft
-- (off-season draft exclusives are hidden from other principals until Memorial Day —
--  that logic is enforced at the app layer via a separate admin-only query)
create policy "Principals see confirmed and own bookings"
  on public.bookings for select
  using (
    public.current_user_role() = 'principal'
    and (status = 'confirmed' or user_id = auth.uid())
  );

-- Papa sees everything
create policy "Papa sees all bookings"
  on public.bookings for select
  using (public.current_user_role() = 'papa');

-- Principals and Papa can insert bookings
create policy "Admins can insert bookings"
  on public.bookings for insert
  with check (public.is_admin() and user_id = auth.uid());

-- Principals and Papa can update their own bookings
create policy "Admins can update own bookings"
  on public.bookings for update
  using (public.is_admin() and user_id = auth.uid());


-- SLEEP ASSIGNMENTS policies
-- Admins only (optimizer page is admin-only)
create policy "Admins can read sleep assignments"
  on public.sleep_assignments for select
  using (public.is_admin());

create policy "Admins can insert sleep assignments"
  on public.sleep_assignments for insert
  with check (public.is_admin());

create policy "Admins can update sleep assignments"
  on public.sleep_assignments for update
  using (public.is_admin());


-- INTERESTS policies
-- All principals can see all interests (coordination signal)
create policy "Principals can view all interests"
  on public.interests for select
  using (public.is_admin());

create policy "Principals can manage own interests"
  on public.interests for all
  using (public.is_admin() and user_id = auth.uid());


-- WAIVER SCORES policies
-- Principals and Papa can see all scores (leaderboard)
create policy "Admins can view all waiver scores"
  on public.waiver_scores for select
  using (public.is_admin());


-- CONFLICTS policies
-- Admins only
create policy "Admins can view conflicts"
  on public.conflicts for select
  using (public.is_admin());

create policy "Admins can manage conflicts"
  on public.conflicts for all
  using (public.is_admin());


-- NOTIFICATIONS policies
-- Each user sees only their own notifications
create policy "Users see own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can mark own notifications read"
  on public.notifications for update
  using (user_id = auth.uid());

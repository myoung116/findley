-- ============================================================
-- Named attendees on a booking. A booker can include specific members
-- of their branch roster; each member is tagged adult/kid so headcount
-- is derived from the actual people attending.
-- ============================================================

-- Age category for roster members (drives adult/kid headcount).
alter table public.branch_members
  add column is_child boolean not null default false;

-- Which roster members are attending a given booking.
create table public.booking_members (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  member_id  uuid not null references public.branch_members (id) on delete cascade,
  primary key (booking_id, member_id)
);

alter table public.booking_members enable row level security;

-- Everyone authenticated can read attendee links (used to show who's there).
create policy "Authenticated users can read booking members"
  on public.booking_members for select
  using (auth.uid() is not null);

-- Writes happen via the service-role client in submitBooking after it has
-- validated the members belong to the booker's branch.

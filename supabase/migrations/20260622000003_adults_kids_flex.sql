-- ============================================================
-- Headcount accuracy + flexible sleeping
--   * bookings: split the party into adults and kids so the daily
--     total reflects real headcount (meal planning), not just beds.
--   * rooms: flex_capacity = extra sleeping spots beyond real beds
--     (pack/play, air mattress, couch). max_occupancy stays = beds.
-- guest_count is kept as the maintained total (adults + kids) so all
-- existing calendar/occupancy code keeps working unchanged.
-- ============================================================

alter table public.bookings
  add column adult_count smallint not null default 1 check (adult_count >= 0),
  add column kid_count   smallint not null default 0 check (kid_count >= 0);

-- Backfill existing rows: treat the whole party as adults (we had no split).
update public.bookings
  set adult_count = greatest(guest_count, 1),
      kid_count = 0;

alter table public.rooms
  add column flex_capacity smallint not null default 0 check (flex_capacity >= 0);

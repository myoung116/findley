-- Cap flex sleeping capacity at 6 per room.
alter table public.rooms
  add constraint rooms_flex_capacity_max check (flex_capacity <= 6);

-- Rename rooms
update public.rooms set name = 'Bunkhouse' where name = 'Twins';
update public.rooms set name = 'Nursery'   where name = 'Studio';

-- Add sort_order column and assign positions
alter table public.rooms add column if not exists sort_order integer not null default 99;

update public.rooms set sort_order = 1 where name = 'Master';
update public.rooms set sort_order = 2 where name = 'Mini Master';
update public.rooms set sort_order = 3 where name = 'Spiral';
update public.rooms set sort_order = 4 where name = 'Bunkhouse';
update public.rooms set sort_order = 5 where name = 'Americas';
update public.rooms set sort_order = 6 where name = 'Nursery';
update public.rooms set sort_order = 7 where name = 'Garage Bunks';

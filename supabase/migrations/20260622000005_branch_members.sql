-- ============================================================
-- Branch member roster — the people in a family branch, managed by
-- that branch's principal. Some members are linked to a login account
-- (the existing users); others (kids, spouses) are roster-only names.
-- Principals can record preferred rooms per member (display only).
-- ============================================================

create table public.branch_members (
  id                 uuid primary key default gen_random_uuid(),
  family_branch      family_branch not null,
  name               text not null,
  linked_user_id     uuid references public.users (id) on delete set null,
  preferred_room_ids uuid[] not null default '{}',
  created_at         timestamptz not null default now()
);

create index branch_members_family_branch_idx on public.branch_members (family_branch);

alter table public.branch_members enable row level security;

-- Everyone authenticated can read the roster (used for branch grouping/display).
create policy "Authenticated users can read branch members"
  on public.branch_members for select
  using (auth.uid() is not null);

-- Writes go through the service-role client in server actions (which authorize
-- principal-owns-branch / admin), so no direct client write policies are needed.

-- Seed: one roster entry per existing user, linked to that account.
insert into public.branch_members (family_branch, name, linked_user_id)
select family_branch, name, id from public.users;

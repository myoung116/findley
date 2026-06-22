-- ============================================================
-- Branch policies — rules a principal sets for the cousins in
-- their own family branch. One row per family branch.
-- ============================================================

create table public.branch_policies (
  family_branch          family_branch primary key,
  require_cousin_approval boolean not null default false,
  cousin_guest_cap        smallint check (cousin_guest_cap is null or cousin_guest_cap > 0),
  updated_by             uuid references public.users (id),
  updated_at             timestamptz not null default now()
);

alter table public.branch_policies enable row level security;

-- Helper: the family branch of the current user
create or replace function public.current_user_branch()
returns family_branch
language sql
security definer
stable
as $$
  select family_branch from public.users where id = auth.uid();
$$;

-- Everyone authenticated can read policies (cousins need to see the rules that
-- apply to them; the calendar/booking flow reads them server-side too).
create policy "Authenticated users can read branch policies"
  on public.branch_policies for select
  using (auth.uid() is not null);

-- A principal may create/update the policy row for their OWN branch only.
create policy "Principals manage their own branch policy"
  on public.branch_policies for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'principal'
        and u.family_branch = branch_policies.family_branch
    )
  );

create policy "Principals update their own branch policy"
  on public.branch_policies for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'principal'
        and u.family_branch = branch_policies.family_branch
    )
  );

-- Admin (Michael only) can manage every branch's policy. Note: is_admin() is
-- broader (true for papa/principal too), so gate on the exact role here.
create policy "Admins manage all branch policies"
  on public.branch_policies for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

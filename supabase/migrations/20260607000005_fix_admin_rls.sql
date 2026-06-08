-- Fix is_admin() to include the 'admin' role (was only 'papa' and 'principal')
-- This function gates INSERT/UPDATE on bookings, sleep_assignments, interests,
-- waiver_scores, and conflicts — all were silently blocking admin users.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select role in ('admin', 'papa', 'principal') from public.users where id = auth.uid();
$$;

-- Admin needs an explicit SELECT policy on bookings (viewer/principal/papa each
-- have their own; admin had none so reads were also blocked).
create policy "Admin sees all bookings"
  on public.bookings for select
  using (public.current_user_role() = 'admin');

-- Admin can cancel/update any booking (not just their own)
create policy "Admin can update any booking"
  on public.bookings for update
  using (public.current_user_role() = 'admin');

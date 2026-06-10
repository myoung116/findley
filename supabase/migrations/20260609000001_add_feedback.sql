create type feedback_category as enum ('bug', 'suggestion', 'question', 'other');
create type feedback_status   as enum ('new', 'reviewed');

create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  category    feedback_category not null default 'suggestion',
  message     text not null,
  status      feedback_status not null default 'new',
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Any authenticated user can insert their own feedback
create policy "Users can submit feedback"
  on public.feedback for insert
  with check (user_id = auth.uid());

-- Users can see their own feedback
create policy "Users can view own feedback"
  on public.feedback for select
  using (user_id = auth.uid());

-- Admin can see and update all feedback
create policy "Admin can manage all feedback"
  on public.feedback for all
  using (public.current_user_role() = 'admin');

-- Phase 6: recurring expense materialization support + push token storage.

-- Link a materialized recurring instance back to the "template" expense it
-- was generated from, and track when the template's next instance is due.
alter table public.expenses
  add column if not exists recurrence_parent_id uuid references public.expenses(id) on delete set null,
  add column if not exists next_occurrence_date date;

comment on column public.expenses.recurrence_parent_id is
  'If set, this expense was auto-generated from a recurring template expense (the referenced row).';
comment on column public.expenses.next_occurrence_date is
  'For a recurring template expense (is_recurring = true), the date the next instance is due to be materialized.';

create index if not exists expenses_recurring_due_idx
  on public.expenses (next_occurrence_date)
  where is_recurring = true;

-- Push notification token registry (Phase 6 stretch: push notifications).
-- Populated client-side by apps/mobile after Expo Notifications permission
-- grant + Notifications.getExpoPushTokenAsync(). A backend function (not yet
-- built) would read this table to fan out real push notifications to other
-- group members on new expense/settlement events.
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expo_push_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.push_tokens enable row level security;

create policy "users can view their own push tokens"
  on public.push_tokens for select
  using (user_id = auth.uid());

create policy "users can insert their own push tokens"
  on public.push_tokens for insert
  with check (user_id = auth.uid());

create policy "users can update their own push tokens"
  on public.push_tokens for update
  using (user_id = auth.uid());

create policy "users can delete their own push tokens"
  on public.push_tokens for delete
  using (user_id = auth.uid());

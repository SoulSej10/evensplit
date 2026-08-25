-- Wire up cross-device push delivery: after a new expense or settlement is
-- inserted, call the notify-group-members Edge Function (via pg_net, async
-- HTTP so it never blocks the insert) which pushes a notification to every
-- OTHER member of the group who has a registered Expo push token.
--
-- NOTE: the anon key below is project-specific (opwiuqodrnhkysmbukme), same
-- caveat as migration 0008.

create or replace function public.notify_group_members_on_expense()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  payer_name text;
begin
  select display_name into payer_name from public.users where id = new.paid_by;

  perform net.http_post(
    url := 'https://opwiuqodrnhkysmbukme.supabase.co/functions/v1/notify-group-members',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd2l1cW9kcm5oa3lzbWJ1a21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODI3MzksImV4cCI6MjEwMzE1ODczOX0.5JQcGNPRV2-gHSkONioqVTqaQW7_jMYlqhUszJrDOJ8'
    ),
    body := jsonb_build_object(
      'group_id', new.group_id,
      'actor_user_id', new.created_by,
      'title', 'New expense',
      'body', coalesce(payer_name, 'Someone') || ' added "' || new.description || '" (' || new.amount || ' ' || new.currency || ')'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_expense_created_notify on public.expenses;
create trigger on_expense_created_notify
  after insert on public.expenses
  for each row execute procedure public.notify_group_members_on_expense();

create or replace function public.notify_group_members_on_settlement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  from_name text;
  to_name text;
begin
  select display_name into from_name from public.users where id = new.from_user;
  select display_name into to_name from public.users where id = new.to_user;

  perform net.http_post(
    url := 'https://opwiuqodrnhkysmbukme.supabase.co/functions/v1/notify-group-members',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd2l1cW9kcm5oa3lzbWJ1a21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODI3MzksImV4cCI6MjEwMzE1ODczOX0.5JQcGNPRV2-gHSkONioqVTqaQW7_jMYlqhUszJrDOJ8'
    ),
    body := jsonb_build_object(
      'group_id', new.group_id,
      'actor_user_id', new.from_user,
      'title', 'Settled up',
      'body', coalesce(from_name, 'Someone') || ' paid ' || coalesce(to_name, 'someone') || ' ' || new.amount || ' ' || (select currency from public.groups where id = new.group_id)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_settlement_created_notify on public.settlements;
create trigger on_settlement_created_notify
  after insert on public.settlements
  for each row execute procedure public.notify_group_members_on_settlement();

-- These trigger functions call net.http_post themselves (not via the anon
-- role at query time), so they don't need public execute grants the way the
-- RLS helper functions do; lock them down the same as the other
-- trigger-only functions from migration 0005.
revoke execute on function public.notify_group_members_on_expense() from public, anon, authenticated;
revoke execute on function public.notify_group_members_on_settlement() from public, anon, authenticated;

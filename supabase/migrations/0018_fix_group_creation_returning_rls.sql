-- Fix: creating a group via `insert().select()` (both web and mobile use
-- this exact pattern in createGroup()) always failed with "new row
-- violates row-level security policy for table groups". Root cause,
-- confirmed by reproducing the exact ordering on a synthetic
-- table+trigger+RLS setup: the groups_select_members policy depends on
-- is_group_member(), which itself depends on the group_members row
-- inserted by the on_group_created AFTER trigger - but Postgres evaluates
-- the RETURNING clause's SELECT-policy check independently of that AFTER
-- trigger's own effect within the same statement, so it never sees the
-- membership row the trigger just created. A later, separate SELECT in
-- the same session sees it fine (proven), which is exactly why this only
-- broke the create flow's immediate .select() and nothing else.
--
-- Fix: let the creator see their own group directly via created_by, which
-- is present on the row being inserted with no trigger dependency at all.
-- This only widens visibility to something the creator would gain anyway
-- one trigger-tick later, so no access-control regression.
drop policy if exists "groups_select_members" on public.groups;
create policy "groups_select_members_or_creator"
  on public.groups for select
  using (public.is_group_member(id) or created_by = auth.uid());

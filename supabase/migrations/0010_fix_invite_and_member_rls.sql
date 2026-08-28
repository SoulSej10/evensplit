-- Security fix: the invite/join flow was previously enforced entirely on
-- the client, backed by RLS policies that were far too permissive:
--
--   1. group_members_insert_self_or_owner allowed ANY authenticated user to
--      insert themselves into ANY group's group_members, with no check that
--      they held a valid invite at all.
--   2. invites_select_members_or_by_code allowed ANY authenticated user to
--      SELECT every pending, unexpired invite row system-wide (not just the
--      one they were sent), leaking group_id/invite_code/invited_email for
--      every outstanding invite and letting anyone harvest group_ids.
--   3. invites_update_accept_or_owner had the matching hole on UPDATE,
--      letting anyone mark someone else's invite accepted_by = themselves.
--   4. settlements_update_members / settlements_delete_members scoped only
--      by group membership, so any member (not just the two parties to a
--      settlement) could edit or delete it.
--
-- Fix: move invite preview + acceptance into SECURITY DEFINER RPCs that do
-- their own validation against the invite row (bypassing RLS internally,
-- the same pattern already used by is_group_member/is_group_owner), and
-- lock the underlying table policies down to "members and the invite's own
-- creator/owner only". The client is updated to call these RPCs instead of
-- reading/writing the invites and group_members tables directly for the
-- join flow.

-- ─────────────────────────────────────────────────────────────────────────
-- Lock down the table-level policies that were the actual hole.
-- ─────────────────────────────────────────────────────────────────────────

drop policy if exists "group_members_insert_self_or_owner" on public.group_members;
create policy "group_members_insert_owner"
  on public.group_members for insert
  with check (public.is_group_owner(group_id));
-- Self-insert (accepting an invite) now only happens inside
-- accept_group_invite(), which is SECURITY DEFINER and bypasses this policy.

drop policy if exists "invites_select_members_or_by_code" on public.invites;
create policy "invites_select_members"
  on public.invites for select
  using (public.is_group_member(group_id));
-- Unauthenticated/not-yet-member preview of an invite now goes through
-- preview_invite(), which is SECURITY DEFINER and bypasses this policy.

drop policy if exists "invites_update_accept_or_owner" on public.invites;
create policy "invites_update_owner"
  on public.invites for update
  using (public.is_group_owner(group_id))
  with check (public.is_group_owner(group_id));
-- Accepting an invite (setting accepted_by) now only happens inside
-- accept_group_invite().

drop policy if exists "settlements_update_members" on public.settlements;
create policy "settlements_update_parties"
  on public.settlements for update
  using (public.is_group_member(group_id) and (from_user = auth.uid() or to_user = auth.uid()))
  with check (public.is_group_member(group_id) and (from_user = auth.uid() or to_user = auth.uid()));

drop policy if exists "settlements_delete_members" on public.settlements;
create policy "settlements_delete_parties"
  on public.settlements for delete
  using (public.is_group_member(group_id) and (from_user = auth.uid() or to_user = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- preview_invite: look up an invite by code for display purposes, before
-- the viewer is (or can prove they should be) a member. Validates
-- expiry/acceptance server-side and returns only what the join screen
-- needs - never the raw invites row.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.preview_invite(p_invite_code text)
returns table (
  invite_id uuid,
  group_id uuid,
  group_name text,
  is_valid boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return query
  select
    i.id,
    i.group_id,
    g.name,
    (i.accepted_by is null and i.expires_at > now())
  from public.invites i
  join public.groups g on g.id = i.group_id
  where i.invite_code = p_invite_code;
end;
$$;

revoke all on function public.preview_invite(text) from public;
grant execute on function public.preview_invite(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- accept_group_invite: validates the invite (exists, unexpired, unaccepted,
-- and - when the invite was targeted at a specific email - that it matches
-- the caller's own auth email) then atomically adds the caller to
-- group_members and marks the invite accepted. Runs as SECURITY DEFINER so
-- it can perform both writes without needing broad table-level policies.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.accept_group_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_caller_email text;
begin
  select * into v_invite from public.invites where id = p_invite_id for update;

  if v_invite is null then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;
  if v_invite.accepted_by is not null then
    raise exception 'Invite has already been used' using errcode = 'P0001';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'Invite has expired' using errcode = 'P0001';
  end if;

  if v_invite.invited_email is not null then
    select email into v_caller_email from auth.users where id = auth.uid();
    if v_caller_email is null or lower(v_caller_email) <> lower(v_invite.invited_email) then
      raise exception 'This invite was sent to a different email address' using errcode = 'P0001';
    end if;
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_invite.group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  update public.invites set accepted_by = auth.uid() where id = v_invite.id;

  return v_invite.group_id;
end;
$$;

revoke all on function public.accept_group_invite(uuid) from public;
grant execute on function public.accept_group_invite(uuid) to authenticated;

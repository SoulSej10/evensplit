-- EvenSplit Row Level Security policies.
-- Every policy scopes access by group membership: a user may only read/write
-- rows belonging to groups they are a member of (via public.group_members).

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_shares enable row level security;
alter table public.settlements enable row level security;
alter table public.invites enable row level security;

-- security definer helper avoids infinite recursion when group_members'
-- own policies would otherwise need to query group_members again.
create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- users: a user can read the profile of anyone they share a group with, and
-- can only edit their own row.
-- ─────────────────────────────────────────────────────────────────────────
create policy "users_select_self_or_groupmates"
  on public.users for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.group_members mine
      join public.group_members theirs on theirs.group_id = mine.group_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.users.id
    )
  );

create policy "users_insert_self"
  on public.users for insert
  with check (id = auth.uid());

create policy "users_update_self"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- groups: members can read; any authenticated user can create a group
-- (they become owner via trigger); only owners can update/archive/delete.
-- ─────────────────────────────────────────────────────────────────────────
create policy "groups_select_members"
  on public.groups for select
  using (public.is_group_member(id));

create policy "groups_insert_authenticated"
  on public.groups for insert
  with check (created_by = auth.uid());

create policy "groups_update_owner"
  on public.groups for update
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

create policy "groups_delete_owner"
  on public.groups for delete
  using (public.is_group_owner(id));

-- ─────────────────────────────────────────────────────────────────────────
-- group_members: members can see the roster of their own groups. A user can
-- remove themselves (leave); owners can remove anyone. Inserts happen via
-- the on_group_created trigger (group creation) or the accept-invite flow
-- (a user inserting their own membership row).
-- ─────────────────────────────────────────────────────────────────────────
create policy "group_members_select_fellow_members"
  on public.group_members for select
  using (public.is_group_member(group_id));

create policy "group_members_insert_self_or_owner"
  on public.group_members for insert
  with check (
    user_id = auth.uid()
    or public.is_group_owner(group_id)
  );

create policy "group_members_delete_self_or_owner"
  on public.group_members for delete
  using (
    user_id = auth.uid()
    or public.is_group_owner(group_id)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- expenses: full CRUD for group members, scoped to their group.
-- ─────────────────────────────────────────────────────────────────────────
create policy "expenses_select_members"
  on public.expenses for select
  using (public.is_group_member(group_id));

create policy "expenses_insert_members"
  on public.expenses for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());

create policy "expenses_update_members"
  on public.expenses for update
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "expenses_delete_members"
  on public.expenses for delete
  using (public.is_group_member(group_id));

-- ─────────────────────────────────────────────────────────────────────────
-- expense_shares: scoped via the parent expense's group.
-- ─────────────────────────────────────────────────────────────────────────
create policy "expense_shares_select_members"
  on public.expense_shares for select
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_shares.expense_id
        and public.is_group_member(e.group_id)
    )
  );

create policy "expense_shares_insert_members"
  on public.expense_shares for insert
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_shares.expense_id
        and public.is_group_member(e.group_id)
    )
  );

create policy "expense_shares_update_members"
  on public.expense_shares for update
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_shares.expense_id
        and public.is_group_member(e.group_id)
    )
  )
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_shares.expense_id
        and public.is_group_member(e.group_id)
    )
  );

create policy "expense_shares_delete_members"
  on public.expense_shares for delete
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_shares.expense_id
        and public.is_group_member(e.group_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- settlements: scoped by group membership.
-- ─────────────────────────────────────────────────────────────────────────
create policy "settlements_select_members"
  on public.settlements for select
  using (public.is_group_member(group_id));

create policy "settlements_insert_members"
  on public.settlements for insert
  with check (
    public.is_group_member(group_id)
    and (from_user = auth.uid() or to_user = auth.uid())
  );

create policy "settlements_update_members"
  on public.settlements for update
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "settlements_delete_members"
  on public.settlements for delete
  using (public.is_group_member(group_id));

-- ─────────────────────────────────────────────────────────────────────────
-- invites: existing members can create/view invites for their group. Invite
-- lookup by code (to join) is intentionally allowed for any authenticated
-- user so they can preview/accept an invite they were sent, but is limited
-- to non-expired, unaccepted invites.
-- ─────────────────────────────────────────────────────────────────────────
create policy "invites_select_members_or_by_code"
  on public.invites for select
  using (
    public.is_group_member(group_id)
    or (accepted_by is null and expires_at > now())
  );

create policy "invites_insert_members"
  on public.invites for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());

create policy "invites_update_accept_or_owner"
  on public.invites for update
  using (
    public.is_group_member(group_id)
    or (accepted_by is null and expires_at > now())
  )
  with check (
    -- accepting: the row must end up pointing at the accepting user
    accepted_by = auth.uid()
    or public.is_group_owner(group_id)
  );

create policy "invites_delete_owner"
  on public.invites for delete
  using (public.is_group_owner(group_id));

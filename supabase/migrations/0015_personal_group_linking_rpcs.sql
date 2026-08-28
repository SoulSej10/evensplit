-- RPCs for 0014's personal <-> group linking. Split into its own migration
-- because a newly added enum value ('group_advance'/'group_reimbursement',
-- added in 0014) cannot be referenced by a function body created in the
-- same transaction that added it.
--
-- These also fix a pre-existing correctness gap flagged by the repo audit:
-- expense + expense_shares were previously written via two separate,
-- non-atomic client-side inserts. create_group_expense/update_group_expense
-- now do both writes (plus the personal-account mirroring) in one atomic
-- SECURITY DEFINER call, the same pattern already used by
-- accept_group_invite (0010).

-- ─────────────────────────────────────────────────────────────────────────
-- create_group_expense: atomically inserts the expense + its precomputed
-- shares (split math stays in packages/shared - this just persists it), and
-- - only if paid_from_account_id is given and the caller is the payer -
-- mirrors the cash movement into personal_transactions as up to two rows:
-- the payer's own share (real personal spending, kind='expense') and, if
-- the amount exceeds that share, the rest advanced for others
-- (kind='group_advance', excluded from personal spending totals).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.create_group_expense(
  p_group_id uuid,
  p_description text,
  p_amount numeric,
  p_currency text,
  p_paid_by uuid,
  p_split_type public.split_type,
  p_category text,
  p_expense_date date,
  p_receipt_url text,
  p_is_recurring boolean,
  p_recurrence_rule text,
  p_shares jsonb, -- [{ "user_id": uuid, "share_amount": numeric }, ...]
  p_paid_from_account_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense_id uuid;
  v_own_share numeric;
  v_advance numeric;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  if p_paid_from_account_id is not null then
    if p_paid_by <> auth.uid() then
      raise exception 'Only the payer can link their own account to this expense' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.personal_accounts
      where id = p_paid_from_account_id and user_id = auth.uid()
    ) then
      raise exception 'Account not found' using errcode = '42501';
    end if;
  end if;

  insert into public.expenses (
    group_id, description, amount, currency, paid_by, split_type, category,
    expense_date, receipt_url, created_by, is_recurring, recurrence_rule, paid_from_account_id
  ) values (
    p_group_id, p_description, p_amount, p_currency, p_paid_by, p_split_type, p_category,
    p_expense_date, p_receipt_url, auth.uid(), coalesce(p_is_recurring, false), p_recurrence_rule,
    p_paid_from_account_id
  )
  returning id into v_expense_id;

  insert into public.expense_shares (expense_id, user_id, share_amount)
  select v_expense_id, (elem ->> 'user_id')::uuid, (elem ->> 'share_amount')::numeric
  from jsonb_array_elements(p_shares) as elem;

  if p_paid_from_account_id is not null then
    select coalesce((elem ->> 'share_amount')::numeric, 0)
    into v_own_share
    from jsonb_array_elements(p_shares) as elem
    where (elem ->> 'user_id')::uuid = p_paid_by
    limit 1;
    v_own_share := coalesce(v_own_share, 0);
    v_advance := p_amount - v_own_share;

    if v_own_share > 0 then
      insert into public.personal_transactions (
        user_id, account_id, kind, amount, note, occurred_at,
        linked_expense_id, linked_group_id
      ) values (
        auth.uid(), p_paid_from_account_id, 'expense', v_own_share, p_description,
        p_expense_date::timestamptz, v_expense_id, p_group_id
      );
    end if;

    if v_advance > 0 then
      insert into public.personal_transactions (
        user_id, account_id, kind, amount, note, occurred_at,
        linked_expense_id, linked_group_id
      ) values (
        auth.uid(), p_paid_from_account_id, 'group_advance', v_advance, p_description,
        p_expense_date::timestamptz, v_expense_id, p_group_id
      );
    end if;
  end if;

  return v_expense_id;
end;
$$;

revoke all on function public.create_group_expense(uuid, text, numeric, text, uuid, public.split_type, text, date, text, boolean, text, jsonb, uuid) from public;
grant execute on function public.create_group_expense(uuid, text, numeric, text, uuid, public.split_type, text, date, text, boolean, text, jsonb, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- update_group_expense: same shape as create, but replaces the existing
-- shares and regenerates the linked personal_transactions rows from
-- scratch (mirrors the existing client update pattern of replacing shares
-- wholesale, now made atomic and linkage-aware).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.update_group_expense(
  p_expense_id uuid,
  p_description text,
  p_amount numeric,
  p_currency text,
  p_paid_by uuid,
  p_split_type public.split_type,
  p_category text,
  p_expense_date date,
  p_receipt_url text,
  p_shares jsonb,
  p_paid_from_account_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_own_share numeric;
  v_advance numeric;
begin
  select group_id into v_group_id from public.expenses where id = p_expense_id;
  if v_group_id is null then
    raise exception 'Expense not found' using errcode = '42501';
  end if;
  if not public.is_group_member(v_group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  if p_paid_from_account_id is not null then
    if p_paid_by <> auth.uid() then
      raise exception 'Only the payer can link their own account to this expense' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.personal_accounts
      where id = p_paid_from_account_id and user_id = auth.uid()
    ) then
      raise exception 'Account not found' using errcode = '42501';
    end if;
  end if;

  update public.expenses set
    description = p_description,
    amount = p_amount,
    currency = p_currency,
    paid_by = p_paid_by,
    split_type = p_split_type,
    category = p_category,
    expense_date = p_expense_date,
    receipt_url = p_receipt_url,
    paid_from_account_id = p_paid_from_account_id
  where id = p_expense_id;

  delete from public.expense_shares where expense_id = p_expense_id;
  insert into public.expense_shares (expense_id, user_id, share_amount)
  select p_expense_id, (elem ->> 'user_id')::uuid, (elem ->> 'share_amount')::numeric
  from jsonb_array_elements(p_shares) as elem;

  delete from public.personal_transactions where linked_expense_id = p_expense_id;

  if p_paid_from_account_id is not null then
    select coalesce((elem ->> 'share_amount')::numeric, 0)
    into v_own_share
    from jsonb_array_elements(p_shares) as elem
    where (elem ->> 'user_id')::uuid = p_paid_by
    limit 1;
    v_own_share := coalesce(v_own_share, 0);
    v_advance := p_amount - v_own_share;

    if v_own_share > 0 then
      insert into public.personal_transactions (
        user_id, account_id, kind, amount, note, occurred_at,
        linked_expense_id, linked_group_id
      ) values (
        auth.uid(), p_paid_from_account_id, 'expense', v_own_share, p_description,
        p_expense_date::timestamptz, p_expense_id, v_group_id
      );
    end if;

    if v_advance > 0 then
      insert into public.personal_transactions (
        user_id, account_id, kind, amount, note, occurred_at,
        linked_expense_id, linked_group_id
      ) values (
        auth.uid(), p_paid_from_account_id, 'group_advance', v_advance, p_description,
        p_expense_date::timestamptz, p_expense_id, v_group_id
      );
    end if;
  end if;
end;
$$;

revoke all on function public.update_group_expense(uuid, text, numeric, text, uuid, public.split_type, text, date, text, jsonb, uuid) from public;
grant execute on function public.update_group_expense(uuid, text, numeric, text, uuid, public.split_type, text, date, text, jsonb, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- record_settlement: inserts the settlement, and - only if from_account_id
-- is given and the caller is from_user - mirrors the debtor's own outflow
-- into personal_transactions as a real expense (it's genuine personal
-- spending: money you owed left your account). The receiving side is
-- deliberately NOT auto-created here - only to_user can say which of their
-- own accounts the money landed in (see confirm_settlement_receipt).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.record_settlement(
  p_group_id uuid,
  p_from_user uuid,
  p_to_user uuid,
  p_amount numeric,
  p_method text,
  p_note text,
  p_from_account_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settlement_id uuid;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;
  if auth.uid() <> p_from_user and auth.uid() <> p_to_user then
    raise exception 'You are not a party to this settlement' using errcode = '42501';
  end if;

  if p_from_account_id is not null then
    if p_from_user <> auth.uid() then
      raise exception 'Only the payer can link their own account to a settlement' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.personal_accounts
      where id = p_from_account_id and user_id = auth.uid()
    ) then
      raise exception 'Account not found' using errcode = '42501';
    end if;
  end if;

  insert into public.settlements (group_id, from_user, to_user, amount, method, note, from_account_id)
  values (p_group_id, p_from_user, p_to_user, p_amount, p_method, p_note, p_from_account_id)
  returning id into v_settlement_id;

  if p_from_account_id is not null then
    insert into public.personal_transactions (
      user_id, account_id, kind, amount, note, occurred_at,
      linked_settlement_id, linked_group_id
    ) values (
      auth.uid(), p_from_account_id, 'expense', p_amount, coalesce(p_note, 'Settle up'),
      now(), v_settlement_id, p_group_id
    );
  end if;

  return v_settlement_id;
end;
$$;

revoke all on function public.record_settlement(uuid, uuid, uuid, numeric, text, text, uuid) from public;
grant execute on function public.record_settlement(uuid, uuid, uuid, numeric, text, text, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- confirm_settlement_receipt: lets to_user attribute an already-recorded
-- settlement's inbound cash to one of their own accounts, after the fact.
-- Inserts their group_reimbursement row (never "income") and stamps
-- settlements.to_account_id. One-time - refuses if already confirmed, so a
-- receivable is never reduced twice for the same settlement.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.confirm_settlement_receipt(
  p_settlement_id uuid,
  p_to_account_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settlement public.settlements;
begin
  select * into v_settlement from public.settlements where id = p_settlement_id;
  if v_settlement is null then
    raise exception 'Settlement not found' using errcode = '42501';
  end if;
  if v_settlement.to_user <> auth.uid() then
    raise exception 'Only the recipient can confirm where this payment landed' using errcode = '42501';
  end if;
  if v_settlement.to_account_id is not null then
    raise exception 'This settlement has already been confirmed' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.personal_accounts
    where id = p_to_account_id and user_id = auth.uid()
  ) then
    raise exception 'Account not found' using errcode = '42501';
  end if;

  update public.settlements set to_account_id = p_to_account_id where id = p_settlement_id;

  insert into public.personal_transactions (
    user_id, account_id, kind, amount, note, occurred_at,
    linked_settlement_id, linked_group_id
  ) values (
    auth.uid(), p_to_account_id, 'group_reimbursement', v_settlement.amount,
    coalesce(v_settlement.note, 'Settle up received'), v_settlement.settled_at,
    v_settlement.id, v_settlement.group_id
  );
end;
$$;

revoke all on function public.confirm_settlement_receipt(uuid, uuid) from public;
grant execute on function public.confirm_settlement_receipt(uuid, uuid) to authenticated;

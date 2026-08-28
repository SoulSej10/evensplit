-- Personal budgeting ("My Money"): a per-user expense/income/budget tracker
-- that lives alongside SplitEven's group-splitting core but is intentionally
-- NOT coupled to it - no group_id anywhere here, no shared tables with
-- expenses/expense_shares/settlements. Every table is scoped by user_id
-- only, so a bug here can never corrupt group balance math, and RLS is
-- trivial ("you can only touch your own rows") rather than the
-- membership-graph checks the group tables need.

-- ─────────────────────────────────────────────────────────────────────────
-- personal_accounts
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.personal_account_type as enum ('cash', 'card', 'wallet', 'savings', 'investment');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.personal_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  type public.personal_account_type not null default 'cash',
  currency text not null default 'USD',
  starting_balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists personal_accounts_user_id_idx on public.personal_accounts (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- personal_categories
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.personal_category_kind as enum ('income', 'expense');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.personal_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  icon text,
  kind public.personal_category_kind not null,
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

create index if not exists personal_categories_user_id_idx on public.personal_categories (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- personal_transactions
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.personal_transaction_kind as enum ('income', 'expense', 'transfer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.personal_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  account_id uuid not null references public.personal_accounts (id) on delete cascade,
  -- Only set (and only meaningful) for kind = 'transfer': the destination
  -- account. account_id is the source account for a transfer.
  transfer_account_id uuid references public.personal_accounts (id) on delete set null,
  category_id uuid references public.personal_categories (id) on delete set null,
  kind public.personal_transaction_kind not null,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (kind <> 'transfer' or transfer_account_id is not null),
  check (kind <> 'transfer' or transfer_account_id <> account_id)
);

create index if not exists personal_transactions_user_id_idx on public.personal_transactions (user_id);
create index if not exists personal_transactions_account_id_idx on public.personal_transactions (account_id);
create index if not exists personal_transactions_occurred_at_idx on public.personal_transactions (occurred_at);

-- ─────────────────────────────────────────────────────────────────────────
-- personal_budgets
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.personal_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category_id uuid not null references public.personal_categories (id) on delete cascade,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create index if not exists personal_budgets_user_id_idx on public.personal_budgets (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS: every table is "you can only see/modify rows where user_id = you".
-- No membership graph, no security-definer helpers needed - this is the
-- simplest possible correct policy shape for single-user data.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.personal_accounts enable row level security;
alter table public.personal_categories enable row level security;
alter table public.personal_transactions enable row level security;
alter table public.personal_budgets enable row level security;

create policy "personal_accounts_own_rows"
  on public.personal_accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "personal_categories_own_rows"
  on public.personal_categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "personal_transactions_own_rows"
  on public.personal_transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "personal_budgets_own_rows"
  on public.personal_budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

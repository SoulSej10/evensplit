-- EvenSplit initial schema
-- Tables per PROJECT_PLAN.md §4.2. Run against a Supabase Postgres project.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- users (extends auth.users)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

comment on table public.users is 'Account profile, 1:1 extension of auth.users.';

-- Auto-create a public.users row whenever a new auth user signs up.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name, default_currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'default_currency', 'USD')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ─────────────────────────────────────────────────────────────────────────
-- groups
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  currency text not null default 'USD',
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────
-- group_members
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.group_member_role as enum ('owner', 'member');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.group_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_members_group_id_idx on public.group_members (group_id);
create index if not exists group_members_user_id_idx on public.group_members (user_id);

-- Auto-add the creator of a group as its owner.
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();

-- ─────────────────────────────────────────────────────────────────────────
-- expenses
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.split_type as enum ('equal', 'exact', 'percentage', 'shares');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  paid_by uuid not null references public.users (id) on delete restrict,
  split_type public.split_type not null default 'equal',
  category text,
  expense_date date not null default current_date,
  receipt_url text,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  is_recurring boolean not null default false,
  recurrence_rule text
);

create index if not exists expenses_group_id_idx on public.expenses (group_id);
create index if not exists expenses_paid_by_idx on public.expenses (paid_by);
create index if not exists expenses_expense_date_idx on public.expenses (expense_date);

-- ─────────────────────────────────────────────────────────────────────────
-- expense_shares
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  share_amount numeric(12, 2) not null check (share_amount >= 0),
  unique (expense_id, user_id)
);

create index if not exists expense_shares_expense_id_idx on public.expense_shares (expense_id);
create index if not exists expense_shares_user_id_idx on public.expense_shares (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- settlements
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  from_user uuid not null references public.users (id) on delete restrict,
  to_user uuid not null references public.users (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  method text,
  settled_at timestamptz not null default now(),
  note text,
  check (from_user <> to_user)
);

create index if not exists settlements_group_id_idx on public.settlements (group_id);
create index if not exists settlements_from_user_idx on public.settlements (from_user);
create index if not exists settlements_to_user_idx on public.settlements (to_user);

-- ─────────────────────────────────────────────────────────────────────────
-- invites
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  invited_email text,
  invite_code text not null default encode(gen_random_bytes(6), 'hex'),
  created_by uuid not null references public.users (id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references public.users (id) on delete set null,
  unique (invite_code)
);

create index if not exists invites_group_id_idx on public.invites (group_id);
create index if not exists invites_invite_code_idx on public.invites (invite_code);

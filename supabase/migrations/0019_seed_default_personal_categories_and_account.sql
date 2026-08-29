-- Every new user's Finances tab used to start completely empty - no
-- categories to file a transaction under, no account to log it against.
-- Seed a sensible starter set on signup, and backfill it once for any
-- existing user who currently has none (so already-created test/demo
-- accounts aren't left behind).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Extend the new-signup trigger to seed defaults going forward.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_currency text;
begin
  v_currency := coalesce(new.raw_user_meta_data ->> 'default_currency', 'USD');

  insert into public.users (id, display_name, default_currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    v_currency
  )
  on conflict (id) do nothing;

  insert into public.personal_categories (user_id, name, icon, kind)
  values
    (new.id, 'Food & Dining', '🍔', 'expense'),
    (new.id, 'Groceries', '🛒', 'expense'),
    (new.id, 'Transport', '🚗', 'expense'),
    (new.id, 'Housing', '🏠', 'expense'),
    (new.id, 'Utilities', '💡', 'expense'),
    (new.id, 'Shopping', '🛍️', 'expense'),
    (new.id, 'Health', '💊', 'expense'),
    (new.id, 'Entertainment', '🎬', 'expense'),
    (new.id, 'Travel', '✈️', 'expense'),
    (new.id, 'Other', '🏷️', 'expense'),
    (new.id, 'Salary', '💰', 'income'),
    (new.id, 'Gifts', '🎁', 'income'),
    (new.id, 'Other income', '💵', 'income')
  on conflict (user_id, name, kind) do nothing;

  insert into public.personal_accounts (user_id, name, type, currency, starting_balance, icon)
  values (new.id, 'Cash', 'cash', v_currency, 0, '💵');

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Backfill: any existing user with zero categories/accounts gets the
--    same starter set, once. Users who already have at least one of either
--    are left untouched - this only fills a genuinely empty Finances tab.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.personal_categories (user_id, name, icon, kind)
select u.id, v.name, v.icon, v.kind::public.personal_category_kind
from public.users u
cross join (
  values
    ('Food & Dining', '🍔', 'expense'),
    ('Groceries', '🛒', 'expense'),
    ('Transport', '🚗', 'expense'),
    ('Housing', '🏠', 'expense'),
    ('Utilities', '💡', 'expense'),
    ('Shopping', '🛍️', 'expense'),
    ('Health', '💊', 'expense'),
    ('Entertainment', '🎬', 'expense'),
    ('Travel', '✈️', 'expense'),
    ('Other', '🏷️', 'expense'),
    ('Salary', '💰', 'income'),
    ('Gifts', '🎁', 'income'),
    ('Other income', '💵', 'income')
) as v(name, icon, kind)
where not exists (select 1 from public.personal_categories pc where pc.user_id = u.id)
on conflict (user_id, name, kind) do nothing;

insert into public.personal_accounts (user_id, name, type, currency, starting_balance, icon)
select u.id, 'Cash', 'cash', u.default_currency, 0, '💵'
from public.users u
where not exists (select 1 from public.personal_accounts pa where pa.user_id = u.id);

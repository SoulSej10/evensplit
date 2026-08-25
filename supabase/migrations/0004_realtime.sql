-- Enable Supabase Realtime (Postgres change subscriptions) for the tables
-- the client needs live updates on: expenses, expense_shares, settlements,
-- and group_members (so a live "who's in the group" / balances view stays
-- in sync without manual refresh).

alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.expense_shares;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.group_members;

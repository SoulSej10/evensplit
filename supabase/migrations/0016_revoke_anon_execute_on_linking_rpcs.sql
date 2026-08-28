-- Same gap fixed in 0011 for the invite RPCs: Supabase grants EXECUTE to
-- anon by default on function creation, independent of an explicit
-- `revoke all ... from public` in the same migration (the default grant is
-- applied directly to anon, not via the public pseudo-role). Close it for
-- the four new personal/group linking RPCs from 0015.
revoke execute on function public.create_group_expense(uuid, text, numeric, text, uuid, public.split_type, text, date, text, boolean, text, jsonb, uuid) from anon;
revoke execute on function public.update_group_expense(uuid, text, numeric, text, uuid, public.split_type, text, date, text, jsonb, uuid) from anon;
revoke execute on function public.record_settlement(uuid, uuid, uuid, numeric, text, text, uuid) from anon;
revoke execute on function public.confirm_settlement_receipt(uuid, uuid) from anon;

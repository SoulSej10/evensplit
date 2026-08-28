-- Supabase grants EXECUTE on new functions to anon/authenticated by default
-- (separately from the PUBLIC pseudo-role), so the plain `revoke ... from
-- public` in migration 0010 didn't actually block the anon role.
-- Neither invite RPC should be callable by a signed-out user - the join
-- screen requires auth first - so revoke explicitly from anon.
revoke execute on function public.preview_invite(text) from anon;
revoke execute on function public.accept_group_invite(uuid) from anon;

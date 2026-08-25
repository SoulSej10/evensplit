-- Supabase Storage buckets for avatars and receipts, with RLS-style storage
-- policies. Files are stored under a per-user folder prefix
-- (`<user_id>/...`) so ownership can be checked from the storage object path.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- avatars: publicly readable (used as <img src>), writable only by the
-- owning user, under a folder keyed by their own uid.
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- receipts: private; readable/writable only by members of the group the
-- receipt was uploaded under. Convention: object path is
-- `<group_id>/<expense_id>/<filename>`.
create policy "receipts_group_members_read"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

create policy "receipts_group_members_write"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

create policy "receipts_group_members_delete"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

-- Switch the app-wide default currency from USD to PHP, matching the
-- actual userbase. Existing rows are untouched; this only changes what new
-- signups get when no explicit default_currency is supplied.

alter table public.users alter column default_currency set default 'PHP';

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
    coalesce(new.raw_user_meta_data ->> 'default_currency', 'PHP')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Lets a personal account carry its own icon (emoji), same convention as
-- personal_categories.icon, so accounts are visually distinguishable in
-- lists instead of all sharing one generic wallet glyph.
alter table public.personal_accounts
  add column if not exists icon text;

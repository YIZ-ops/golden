-- Drop legacy author_role from quotes; role information now comes from people.role via person_id.

drop index if exists public.quotes_author_role_author_created_at_idx;
drop index if exists public.quotes_author_role_idx;

alter table public.quotes
  drop column if exists author_role;

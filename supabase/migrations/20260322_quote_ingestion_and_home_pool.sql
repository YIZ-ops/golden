alter table public.quotes
  add column if not exists source_quote_id text;

create unique index if not exists quotes_source_type_quote_id_uidx
on public.quotes(source_type, source_quote_id);

create or replace function public.random_home_quotes(
  limit_count integer default 5,
  excluded_ids uuid[] default '{}'
)
returns setof public.quotes
language sql
security definer
set search_path = public
as $$
  select *
  from public.quotes
  where not (id = any(coalesce(excluded_ids, '{}'::uuid[])))
  order by random()
  limit greatest(coalesce(limit_count, 0), 0);
$$;

grant execute on function public.random_home_quotes(integer, uuid[]) to anon;
grant execute on function public.random_home_quotes(integer, uuid[]) to authenticated;

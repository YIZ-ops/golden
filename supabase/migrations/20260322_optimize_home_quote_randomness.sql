alter table public.quotes
  add column if not exists home_random double precision;

update public.quotes
set home_random = random()
where home_random is null;

alter table public.quotes
  alter column home_random set default random();

alter table public.quotes
  alter column home_random set not null;

create index if not exists quotes_home_random_idx
on public.quotes(home_random);

create index if not exists quotes_created_at_idx
on public.quotes(created_at desc);

create index if not exists quotes_category_created_at_idx
on public.quotes(category, created_at desc);

create index if not exists quotes_person_created_at_idx
on public.quotes(person_id, created_at desc);

create index if not exists quotes_author_role_author_created_at_idx
on public.quotes(author_role, author, created_at desc);

create index if not exists favorites_user_created_at_idx
on public.favorites(user_id, created_at desc);

create index if not exists favorites_user_folder_created_at_idx
on public.favorites(user_id, folder_id, created_at desc);

create or replace function public.random_home_quotes(
  limit_count integer default 5,
  excluded_ids uuid[] default '{}'
)
returns setof public.quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_limit integer := greatest(coalesce(limit_count, 0), 0);
  start_key double precision := random();
begin
  if requested_limit = 0 then
    return;
  end if;

  return query
  with first_pass as (
    select q.id, q.home_random
    from public.quotes q
    where not (q.id = any(coalesce(excluded_ids, '{}'::uuid[])))
      and q.home_random >= start_key
    order by q.home_random asc
    limit requested_limit
  ),
  remaining_slots as (
    select greatest(requested_limit - count(*), 0) as remaining
    from first_pass
  ),
  second_pass as (
    select q.id, q.home_random
    from public.quotes q
    where not (q.id = any(coalesce(excluded_ids, '{}'::uuid[])))
      and q.home_random < start_key
    order by q.home_random asc
    limit (select remaining from remaining_slots)
  ),
  picked as (
    select 0 as bucket, id, home_random
    from first_pass
    union all
    select 1 as bucket, id, home_random
    from second_pass
  )
  select q.*
  from picked
  join public.quotes q on q.id = picked.id
  order by picked.bucket asc, picked.home_random asc;
end;
$$;

grant execute on function public.random_home_quotes(integer, uuid[]) to anon;
grant execute on function public.random_home_quotes(integer, uuid[]) to authenticated;

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  aliases text[] null,
  bio text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_role_check check (role in ('author', 'singer')),
  constraint people_name_role_unique unique (name, role)
);

alter table public.quotes add column if not exists person_id uuid references public.people(id) on delete set null;

insert into public.people (name, role)
select distinct author, author_role
from public.quotes
where author is not null
  and author_role in ('author', 'singer')
on conflict (name, role) do nothing;

update public.quotes q
set person_id = p.id
from public.people p
where q.person_id is null
  and p.name = q.author
  and p.role = q.author_role;

create index if not exists people_role_idx on public.people(role);
create index if not exists quotes_person_idx on public.quotes(person_id);

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
before update on public.people
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.people enable row level security;

drop policy if exists "people_read_anon" on public.people;
create policy "people_read_anon"
on public.people
for select
to anon
using (true);

drop policy if exists "people_read_authenticated" on public.people;
create policy "people_read_authenticated"
on public.people
for select
to authenticated
using (true);

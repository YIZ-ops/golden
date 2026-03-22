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

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  work_type text not null,
  published_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint works_type_check check (work_type in ('book', 'song', 'speech', 'interview', 'essay', 'other'))
);

alter table public.quotes add column if not exists person_id uuid references public.people(id) on delete set null;
alter table public.quotes add column if not exists work_id uuid references public.works(id) on delete set null;
alter table public.quotes add column if not exists excerpt_type text not null default 'quote';
alter table public.quotes add column if not exists verified boolean not null default false;

insert into public.people (name, role)
select distinct author, author_role
from public.quotes
where author is not null
  and author_role in ('author', 'singer')
on conflict (name, role) do nothing;

insert into public.works (title, work_type)
select distinct
  source,
  case
    when author_role = 'singer' then 'song'
    when category = '文学' then 'book'
    else 'other'
  end
from public.quotes
where source is not null
  and btrim(source) <> ''
on conflict do nothing;

update public.quotes q
set person_id = p.id
from public.people p
where q.person_id is null
  and p.name = q.author
  and p.role = q.author_role;

update public.quotes q
set work_id = w.id
from public.works w
where q.work_id is null
  and q.source is not null
  and w.title = q.source;

update public.quotes
set excerpt_type = case
  when author_role = 'singer' then 'lyric'
  else 'quote'
end
where excerpt_type = 'quote';

update public.quotes
set verified = true
where source_type = 'seed';

create index if not exists people_role_idx on public.people(role);
create index if not exists works_title_idx on public.works(title);
create index if not exists quotes_person_idx on public.quotes(person_id);
create index if not exists quotes_work_idx on public.quotes(work_id);

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
before update on public.people
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at
before update on public.works
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.people enable row level security;
alter table public.works enable row level security;

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

drop policy if exists "works_read_anon" on public.works;
create policy "works_read_anon"
on public.works
for select
to anon
using (true);

drop policy if exists "works_read_authenticated" on public.works;
create policy "works_read_authenticated"
on public.works
for select
to authenticated
using (true);

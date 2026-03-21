create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  theme_mode text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  author text not null,
  author_role text not null default 'unknown',
  source text,
  category text,
  source_type text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_author_role_check check (author_role in ('author', 'singer', 'unknown'))
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_quote_unique unique (user_id, quote_id)
);

create table if not exists public.heartbeats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  count integer not null default 0,
  last_liked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint heartbeats_user_quote_unique unique (user_id, quote_id)
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_category_idx on public.quotes(category);
create index if not exists quotes_author_idx on public.quotes(author);
create index if not exists quotes_author_role_idx on public.quotes(author_role);
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists favorites_quote_idx on public.favorites(quote_id);
create index if not exists heartbeats_user_idx on public.heartbeats(user_id);
create index if not exists reflections_user_quote_idx on public.reflections(user_id, quote_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists heartbeats_set_updated_at on public.heartbeats;
create trigger heartbeats_set_updated_at
before update on public.heartbeats
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists reflections_set_updated_at on public.reflections;
create trigger reflections_set_updated_at
before update on public.reflections
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.profiles enable row level security;
alter table public.quotes enable row level security;
alter table public.favorites enable row level security;
alter table public.heartbeats enable row level security;
alter table public.reflections enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "quotes_read_anon" on public.quotes;
create policy "quotes_read_anon"
on public.quotes
for select
to anon
using (true);

drop policy if exists "quotes_read_authenticated" on public.quotes;
create policy "quotes_read_authenticated"
on public.quotes
for select
to authenticated
using (true);

drop policy if exists "favorites_select_self" on public.favorites;
create policy "favorites_select_self"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "favorites_insert_self" on public.favorites;
create policy "favorites_insert_self"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_self" on public.favorites;
create policy "favorites_delete_self"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "heartbeats_select_self" on public.heartbeats;
create policy "heartbeats_select_self"
on public.heartbeats
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "heartbeats_insert_self" on public.heartbeats;
create policy "heartbeats_insert_self"
on public.heartbeats
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "heartbeats_update_self" on public.heartbeats;
create policy "heartbeats_update_self"
on public.heartbeats
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reflections_select_self" on public.reflections;
create policy "reflections_select_self"
on public.reflections
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reflections_insert_self" on public.reflections;
create policy "reflections_insert_self"
on public.reflections
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reflections_update_self" on public.reflections;
create policy "reflections_update_self"
on public.reflections
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reflections_delete_self" on public.reflections;
create policy "reflections_delete_self"
on public.reflections
for delete
to authenticated
using (auth.uid() = user_id);

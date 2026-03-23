create table if not exists public.favorite_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists favorite_folders_user_idx on public.favorite_folders(user_id);
create unique index if not exists favorite_folders_one_default_per_user_idx
  on public.favorite_folders(user_id)
  where is_default = true;

alter table public.favorites
  add column if not exists folder_id uuid references public.favorite_folders(id) on delete set null;

create index if not exists favorites_folder_idx on public.favorites(folder_id);

drop trigger if exists favorite_folders_set_updated_at on public.favorite_folders;
create trigger favorite_folders_set_updated_at
before update on public.favorite_folders
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.favorite_folders enable row level security;

drop policy if exists "favorite_folders_select_self" on public.favorite_folders;
create policy "favorite_folders_select_self"
on public.favorite_folders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "favorite_folders_insert_self" on public.favorite_folders;
create policy "favorite_folders_insert_self"
on public.favorite_folders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "favorite_folders_update_self" on public.favorite_folders;
create policy "favorite_folders_update_self"
on public.favorite_folders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "favorite_folders_delete_self" on public.favorite_folders;
create policy "favorite_folders_delete_self"
on public.favorite_folders
for delete
to authenticated
using (auth.uid() = user_id);

insert into public.favorite_folders (user_id, name, is_default)
select distinct user_id, '默认收藏夹', true
from public.favorites
where user_id is not null
on conflict do nothing;

update public.favorites f
set folder_id = d.id
from public.favorite_folders d
where f.user_id = d.user_id
  and d.is_default = true
  and f.folder_id is null;

-- Restore quote read visibility:
-- all users can read quotes; favorites/heartbeats/reflections remain user-scoped by their own RLS.

drop policy if exists "quotes_read_system_or_own" on public.quotes;
drop policy if exists "quotes_read_authenticated_system_or_own" on public.quotes;

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

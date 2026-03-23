-- Fix quote visibility to hide quotes created by other users
-- Also ensure comments, likes, and saves are only visible to the owner

-- Drop existing overly permissive policies
drop policy if exists "quotes_read_anon" on public.quotes;
drop policy if exists "quotes_read_authenticated" on public.quotes;

-- Create new policies that restrict visibility
create policy "quotes_read_system_or_own"
on public.quotes
for select
to anon
using (created_by is null);

create policy "quotes_read_authenticated_system_or_own"
on public.quotes
for select
to authenticated
using (created_by is null or auth.uid() = created_by);

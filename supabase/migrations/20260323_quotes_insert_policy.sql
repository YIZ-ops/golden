-- Add INSERT policy to quotes table to allow authenticated users to create manual quotes

drop policy if exists "quotes_insert_authenticated" on public.quotes;
create policy "quotes_insert_authenticated"
on public.quotes
for insert
to authenticated
with check (auth.uid() = created_by);

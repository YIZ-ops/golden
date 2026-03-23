-- Allow authenticated users to update/delete only their own manually created quotes

drop policy if exists "quotes_update_own_manual" on public.quotes;
create policy "quotes_update_own_manual"
on public.quotes
for update
to authenticated
using (auth.uid() = created_by and source_type = 'manual')
with check (auth.uid() = created_by and source_type = 'manual');

drop policy if exists "quotes_delete_own_manual" on public.quotes;
create policy "quotes_delete_own_manual"
on public.quotes
for delete
to authenticated
using (auth.uid() = created_by and source_type = 'manual');

drop index if exists public.quotes_work_idx;
drop index if exists public.works_title_idx;

alter table if exists public.quotes
  drop column if exists work_id,
  drop column if exists excerpt_type,
  drop column if exists verified;

drop table if exists public.works;

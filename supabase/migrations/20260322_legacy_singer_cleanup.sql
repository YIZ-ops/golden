insert into public.people (name, role)
values
  ('王菲', 'singer')
on conflict (name, role) do nothing;

update public.quotes q
set
  author = '周杰伦',
  person_id = p.id
from public.people p
where q.author_role = 'singer'
  and q.source in ('青花瓷', '晴天')
  and p.name = '周杰伦'
  and p.role = 'singer';

update public.quotes q
set
  author = '王菲',
  person_id = p.id
from public.people p
where q.author_role = 'singer'
  and q.source = '旋木'
  and p.name = '王菲'
  and p.role = 'singer';

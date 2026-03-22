insert into public.quotes (content, author, author_role, source, category, source_type)
values
  ('真正重要的东西，用眼睛是看不见的。', '安托万·德·圣-埃克苏佩里', 'author', '小王子', '文学', 'seed'),
  ('人生海海，山山而川，不过尔尔。', '麦家', 'author', '人生海海', '哲理', 'seed')
on conflict do nothing;

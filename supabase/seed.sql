insert into public.quotes (content, author, author_role, source, category, source_type)
values
  ('真正重要的东西，用眼睛是看不见的。', '安托万·德·圣-埃克苏佩里', 'author', '小王子', '文学', 'seed'),
  ('愿你出走半生，归来仍是少年。', '冯唐', 'author', '冯唐诗百首', '文学', 'seed'),
  ('我一直想从你的窗子里看月亮。', '张爱玲', 'author', '倾城之恋', '文学', 'seed'),
  ('也许世界上也有五千朵和你一样的花，但只有你是我独一无二的玫瑰。', '安托万·德·圣-埃克苏佩里', 'author', '小王子', '爱情', 'seed'),
  ('天青色等烟雨，而我在等你。', '方文山', 'singer', '青花瓷', '网易云', 'seed'),
  ('故事的小黄花，从出生那年就飘着。', '方文山', 'singer', '晴天', '网易云', 'seed'),
  ('你说爱像云，要自在飘浮才美丽。', '姚谦', 'singer', '旋木', '网易云', 'seed'),
  ('人生海海，山山而川，不过尔尔。', '麦家', 'author', '人生海海', '哲理', 'seed')
on conflict do nothing;

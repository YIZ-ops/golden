insert into public.people (name, role, aliases, bio)
values
  ('鲁迅', 'author', array['周树人'], '中国现代文学重要作家'),
  ('老舍', 'author', null, '中国现代小说家、戏剧家'),
  ('朱自清', 'author', null, '中国现代散文家、诗人'),
  ('冰心', 'author', null, '中国现代作家、翻译家'),
  ('孔子', 'author', null, '中国古代思想家、教育家'),
  ('老子', 'author', null, '中国古代思想家'),
  ('庄子', 'author', null, '中国古代哲学家'),
  ('李白', 'author', null, '唐代诗人'),
  ('杜甫', 'author', null, '唐代诗人'),
  ('陶渊明', 'author', null, '东晋诗人'),
  ('苏轼', 'author', null, '北宋文学家'),
  ('王维', 'author', null, '唐代诗人'),
  ('李清照', 'author', null, '宋代词人'),
  ('辛弃疾', 'author', null, '南宋词人'),
  ('周杰伦', 'singer', null, '华语流行歌手'),
  ('陈奕迅', 'singer', null, '华语流行歌手'),
  ('王菲', 'singer', null, '华语流行歌手')
on conflict (name, role) do nothing;

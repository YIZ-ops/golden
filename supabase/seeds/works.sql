insert into public.works (title, work_type)
select seed.title, seed.work_type
from (
  values
    ('朝花夕拾', 'book'),
    ('骆驼祥子', 'book'),
    ('背影', 'essay'),
    ('繁星·春水', 'book'),
    ('论语', 'book'),
    ('道德经', 'book'),
    ('庄子', 'book'),
    ('行路难', 'other'),
    ('将进酒', 'other'),
    ('南陵别儿童入京', 'other'),
    ('望岳', 'other'),
    ('奉赠韦左丞丈二十二韵', 'other'),
    ('月夜忆舍弟', 'other'),
    ('饮酒·其五', 'other'),
    ('归园田居·其一', 'other'),
    ('定风波', 'other'),
    ('蝶恋花·春景', 'other'),
    ('临江仙·送钱穆父', 'other'),
    ('山居秋暝', 'other'),
    ('声声慢', 'other'),
    ('青玉案·元夕', 'other'),
    ('晴天', 'song'),
    ('十年', 'song'),
    ('青花瓷', 'song'),
    ('旋木', 'song')
) as seed(title, work_type)
where not exists (
  select 1
  from public.works w
  where w.title = seed.title
);

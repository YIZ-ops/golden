insert into public.quotes (
  content,
  author,
  author_role,
  source,
  category,
  source_type,
  person_id
)
select
  seed.content,
  seed.author,
  seed.author_role,
  seed.source,
  seed.category,
  seed.source_type,
  p.id
from (
  values
    ('我家门前有两棵树，一棵是枣树，另一棵也是枣树。', '鲁迅', 'author', '朝花夕拾', '文学', 'seed'),
    ('希望本是无所谓有，无所谓无的。', '鲁迅', 'author', '朝花夕拾', '哲理', 'seed'),
    ('雨下给富人，也下给穷人；下给义人，也下给不义的人。', '老舍', 'author', '骆驼祥子', '文学', 'seed'),
    ('沉默有时候是最稳妥的回答。', '老舍', 'author', '骆驼祥子', '哲理', 'seed'),
    ('我买几个橘子去。你就在此地，不要走动。', '朱自清', 'author', '背影', '文学', 'seed'),
    ('愿你的生命中有够多的云翳，来造成一个美丽的黄昏。', '冰心', 'author', '繁星·春水', '哲理', 'seed'),
    ('学而时习之，不亦说乎。', '孔子', 'author', '论语', '哲学', 'seed'),
    ('三人行，必有我师焉。', '孔子', 'author', '论语', '哲学', 'seed'),
    ('知之为知之，不知为不知，是知也。', '孔子', 'author', '论语', '哲学', 'seed'),
    ('己所不欲，勿施于人。', '孔子', 'author', '论语', '哲学', 'seed'),
    ('上善若水，水善利万物而不争。', '老子', 'author', '道德经', '哲学', 'seed'),
    ('千里之行，始于足下。', '老子', 'author', '道德经', '哲学', 'seed'),
    ('大成若缺，其用不弊。', '老子', 'author', '道德经', '哲学', 'seed'),
    ('相濡以沫，不如相忘于江湖。', '庄子', 'author', '庄子', '哲学', 'seed'),
    ('人生天地之间，若白驹之过隙，忽然而已。', '庄子', 'author', '庄子', '哲学', 'seed'),
    ('君子之交淡若水。', '庄子', 'author', '庄子', '哲学', 'seed'),
    ('长风破浪会有时，直挂云帆济沧海。', '李白', 'author', '行路难', '诗词', 'seed'),
    ('天生我材必有用，千金散尽还复来。', '李白', 'author', '将进酒', '诗词', 'seed'),
    ('仰天大笑出门去，我辈岂是蓬蒿人。', '李白', 'author', '南陵别儿童入京', '诗词', 'seed'),
    ('会当凌绝顶，一览众山小。', '杜甫', 'author', '望岳', '诗词', 'seed'),
    ('读书破万卷，下笔如有神。', '杜甫', 'author', '奉赠韦左丞丈二十二韵', '诗词', 'seed'),
    ('露从今夜白，月是故乡明。', '杜甫', 'author', '月夜忆舍弟', '诗词', 'seed'),
    ('采菊东篱下，悠然见南山。', '陶渊明', 'author', '饮酒·其五', '诗词', 'seed'),
    ('羁鸟恋旧林，池鱼思故渊。', '陶渊明', 'author', '归园田居·其一', '诗词', 'seed'),
    ('莫听穿林打叶声，何妨吟啸且徐行。', '苏轼', 'author', '定风波', '诗词', 'seed'),
    ('竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。', '苏轼', 'author', '定风波', '诗词', 'seed'),
    ('枝上柳绵吹又少，天涯何处无芳草。', '苏轼', 'author', '蝶恋花·春景', '诗词', 'seed'),
    ('人生如逆旅，我亦是行人。', '苏轼', 'author', '临江仙·送钱穆父', '诗词', 'seed'),
    ('明月松间照，清泉石上流。', '王维', 'author', '山居秋暝', '诗词', 'seed'),
    ('此情无计可消除，才下眉头，却上心头。', '李清照', 'author', '声声慢', '诗词', 'seed'),
    ('众里寻他千百度。蓦然回首，那人却在，灯火阑珊处。', '辛弃疾', 'author', '青玉案·元夕', '诗词', 'seed')
) as seed(content, author, author_role, source, category, source_type)
join public.people p
  on p.name = seed.author
 and p.role = seed.author_role
where not exists (
  select 1
  from public.quotes q
  where q.content = seed.content
    and q.author = seed.author
    and coalesce(q.source, '') = coalesce(seed.source, '')
);

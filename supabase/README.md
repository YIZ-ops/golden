# Supabase 本地资产说明

本目录保存金句 App 的数据库初始化资产。

## 文件说明

- `migrations/20260321_initial_schema.sql`
  - 创建核心表、索引、触发器和 RLS policy
- `migrations/20260322_people_works_quotes.sql`
  - 新增 `people / works`，并把旧 `quotes` 回填到新关系字段
- `migrations/20260322_legacy_singer_cleanup.sql`
  - 把历史上误归到词作者名下的歌曲句子回归到真实歌手
- `seed.sql`
  - 写入最小启动种子
- `seeds/people.sql`
  - 人物种子
- `seeds/works.sql`
  - 作品种子
- `seeds/quotes-curated.sql`
  - 已整理的扩展句子种子
- `config.toml`
  - 本地 Supabase CLI 配置占位

## 建议初始化顺序

1. 安装 Supabase CLI
2. 在项目根目录执行 `supabase start`
3. 执行 migration
4. 执行 `seed.sql`
5. 执行 `seeds/people.sql`
6. 执行 `seeds/works.sql`
7. 执行 `seeds/quotes-curated.sql`

远程数据库初始化脚本 `npm run db:init:remote` 已按上述顺序执行全部 SQL 文件。

## Profile 补建约定

服务端首次读取用户资料时，必须使用幂等补建模式：

```sql
insert into public.profiles (id, email, display_name)
values ($1, $2, $3)
on conflict (id) do nothing;
```

然后再读取 profile 返回给前端。

## 注意事项

- `quotes` 支持匿名读取
- `people / works` 支持匿名读取，供分类页动态聚合作者和歌手入口
- `favorites / heartbeats / reflections / profiles` 必须依赖 JWT + RLS
- `service_role` 只允许在服务端环境使用，不能暴露到浏览器
- 所有 seed 文件都应保持可重复执行；新增数据时优先追加到 `supabase/seeds/`

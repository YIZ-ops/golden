# Supabase 本地资产说明

本目录保存金句 App 的数据库初始化资产。

## 文件说明

- `migrations/20260321_initial_schema.sql`
  - 创建核心表、索引、触发器和 RLS policy
- `seed.sql`
  - 写入首批金句种子
- `config.toml`
  - 本地 Supabase CLI 配置占位

## 建议初始化顺序

1. 安装 Supabase CLI
2. 在项目根目录执行 `supabase start`
3. 执行 migration
4. 执行 seed

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
- `favorites / heartbeats / reflections / profiles` 必须依赖 JWT + RLS
- `service_role` 只允许在服务端环境使用，不能暴露到浏览器

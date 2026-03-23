# 数据库结构与依赖落地说明（2026-03-23）

## 目标

本文档用于固化当前 `Supabase Postgres` 的真实结构、关键依赖与迁移顺序，作为后续演进基线。

---

## 一、核心表结构

### 1) `public.profiles`

- 主键：`id`（引用 `auth.users.id`）
- 主要字段：`email`、`display_name`、`avatar_url`、`theme_mode`
- 用途：用户展示信息与偏好设置

### 2) `public.people`

- 主键：`id`
- 唯一键：`(name, role)`
- 主要字段：`name`、`role(author|singer)`、`aliases`、`bio`
- 用途：人物标准化实体（作者/歌手）

### 3) `public.quotes`

- 主键：`id`
- 主要字段：
  - 内容域：`content`、`author`、`source`、`category`
  - 来源域：`source_type`（`seed | hitokoto | manual`）、`source_quote_id`
  - 归属域：`created_by`（手动金句所有者）
  - 关联域：`person_id -> people.id`
  - 随机域：`home_random`
- 已清理：`author_role` 已移除（见迁移 `20260323_drop_quotes_author_role.sql`）

### 4) `public.favorite_folders`

- 主键：`id`
- 主要字段：`user_id`、`name`、`is_default`
- 用途：收藏夹分组

### 5) `public.favorites`

- 主键：`id`
- 唯一键：`(user_id, quote_id)`
- 主要字段：`user_id`、`quote_id`、`folder_id`
- 用途：用户收藏关系

### 6) `public.heartbeats`

- 主键：`id`
- 唯一键：`(user_id, quote_id)`
- 主要字段：`count`、`last_liked_at`
- 用途：心动累计

### 7) `public.reflections`

- 主键：`id`
- 主要字段：`user_id`、`quote_id`、`content`
- 用途：用户感悟

---

## 二、关键索引与函数依赖

### `quotes` 关键索引

- 唯一索引：`(source_type, source_quote_id)`
  - 作用：外部源（如 hitokoto）幂等去重
- 随机索引：`home_random`
  - 作用：首页随机抽样性能保障
- 常规索引：`created_at`、`category+created_at`、`person_id+created_at`

### 首页随机函数

- 函数：`public.random_home_quotes(limit_count, excluded_ids)`
- 依赖：`quotes.home_random`
- 调用方：`GET /api/home/quotes`

---

## 三、RLS 策略依赖（重点）

### `quotes` 可见性与写权限

- 读：
  - 匿名：仅可见 `created_by is null` 的系统金句
  - 登录：可见系统金句 + 自己创建的金句
- 写：
  - 插入：`auth.uid() = created_by`
  - 更新/删除：`auth.uid() = created_by and source_type = 'manual'`

> 结论：`created_by` 与 `source_type` 是权限模型核心字段，不可移除。

---

## 四、应用层字段依赖映射

### API 依赖

- `api/quotes/index.ts`
  - 新建手动金句写入：`source_type='manual'`、`created_by=user.id`
  - 编辑/删除校验：依赖 `created_by` + `source_type`
- `api/quotes/ingest.ts`
  - 一言入库依赖：`source_type='hitokoto'`、`source_quote_id` 去重
- `api/home/quotes.ts`
  - 首页抽样依赖 `random_home_quotes`

### 前端依赖

- `src/pages/favorites/FavoriteFolderQuotesPage.tsx`
  - 可编辑判断：`sourceType === 'manual' && createdBy === user.id`
- `src/pages/categories/CategoryQuotesPage.tsx`
  - 人物筛选已基于 `personId`，不再依赖 `author_role`

---

## 五、迁移与初始化落地

### 迁移文件

- 新增：`supabase/migrations/20260323_drop_quotes_author_role.sql`
  - 删除列：`quotes.author_role`
  - 删除索引：`quotes_author_role_idx`、`quotes_author_role_author_created_at_idx`

### 初始化脚本

- 文件：`scripts/init-remote-db.mjs`
- 已纳入上述新迁移，确保远程初始化/重放时结构一致。

---

## 六、运维建议

1. 新增字段时，先定义“RLS 依赖/业务依赖/索引依赖”三类影响。
2. 变更字段前，先完成 API 与前端解耦，再做 DDL。
3. 迁移脚本保持“可重复执行”与“顺序稳定”。
4. 每次结构变更后，同步更新本文档与 [app-architecture.md](./app-architecture.md)。

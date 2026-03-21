# 金句 App 重构设计文档

**日期：** 2026-03-21  
**项目：** Golden 金句 App  
**目标：** 将当前单文件前端重构为四个一级页面，移除 Firebase，改为 `Supabase Auth + Postgres + Vercel Functions`，并补齐可落地的架构说明。

---

## 1. 背景与现状

当前项目是一个基于 `Vite + React 19 + TypeScript` 的 Web 应用，主入口为 [src/App.tsx](/C:/Users/14798/Desktop/金/src/App.tsx)。

当前实现存在以下结构性问题：

1. `App.tsx` 同时承载路由切换、页面 UI、认证、数据库读写、第三方接口调用、导出图片、主题与样式编辑等职责，文件过大且边界模糊。
2. 页面不是通过真实路由组织，而是依赖 `activeTab` 本地状态在单文件中切换 `home / categories / favorites / settings`。
3. 数据层强耦合在前端，[src/firebase.ts](/C:/Users/14798/Desktop/金/src/firebase.ts) 将 Firebase Auth 和 Firestore 直接暴露给页面逻辑。
4. 认证方式依赖 Firebase Google 登录，与目标“账号密码注册/登录/重置密码”不一致。
5. 部署目标尚未收敛到 `Vercel + Vercel Functions`，缺少适合当前业务的 BFF 边界。

当前核心业务对象已经比较明确，来自 [src/types.ts](/C:/Users/14798/Desktop/金/src/types.ts)：

- `Quote`
- `Favorite`
- `Heartbeat`
- `Reflection`
- `UserProfile`

这些对象为后续迁移到 Supabase 提供了稳定的领域模型基础。

---

## 2. 设计目标

本次重构聚焦以下结果：

1. 将现有应用拆分为四个一级页面，并使用真实路由管理页面切换。
2. 用 `Supabase Auth` 替换 Firebase 认证，支持账号密码的注册、登录、忘记密码和密码重置。
3. 用 `Supabase Postgres` 替换 Firestore，完成业务数据迁移。
4. 在 `Vercel Functions` 中收口业务 API，避免页面直接耦合数据库细节。
5. 补齐架构文档、数据库脚本、环境变量说明和部署说明，保证项目可初始化、可部署、可扩展。
6. 明确本期不做旧 Firebase 账号与互动数据的自动迁移，采用干净切换方案。

非目标：

1. 不在本次重构中引入后台管理系统。
2. 不在本次重构中新增推荐算法、内容审核、复杂统计看板。
3. 不对现有视觉风格做大幅重设计，以结构重构和技术替换为主。
4. 不在本期做 Firebase 到 Supabase 的在线账号合并或历史行为数据自动迁移。

---

## 3. 方案选择

### 3.1 备选方案

**方案 A：最小拆分**
- 仅引入路由，把四个 Tab 拆成页面。
- 页面继续直接访问 Supabase。
- Vercel 主要承担静态托管。

问题：
- 不符合 `Vercel Functions` 的目标部署形态。
- 业务读写逻辑仍然散落在前端，后续还要再拆。

**方案 B：页面路由 + BFF 分层**
- 前端使用 `React Router` 管理四个一级页面。
- 认证由前端使用 Supabase Auth SDK 完成。
- 业务数据统一经由 `Vercel Functions` 访问 Supabase。
- Supabase 负责 Auth、Postgres 和 RLS。

优点：
- 满足目标技术路线。
- 页面、业务接口、数据存储边界清晰。
- 后续扩展后台、审核、推荐、限流更自然。

**方案 C：完全服务端主导**
- 登录、会话、业务读写全部通过服务端代理。
- 前端只保留展示职责。

问题：
- 对当前产品规模偏重。
- 成本高，收益不匹配。

### 3.2 最终选择

采用 **方案 B：页面路由 + BFF 分层**。

原因：

1. 兼顾当前需求与后续可扩展性。
2. 能在不引入过度复杂度的前提下完成前后端边界重建。
3. 可以在保留现有视觉体验的基础上完成结构重构。

---

## 4. 目标架构

目标架构分为四层：

1. **页面层**
   - 承担页面布局、交互和状态展示。
   - 通过路由组织四个一级页面。

2. **前端能力层**
   - 包含共享组件、hooks、工具函数、API client。
   - 页面不直接处理数据库细节。

3. **BFF 层（Vercel Functions）**
   - 校验当前用户身份。
   - 聚合和标准化业务数据。
   - 提供稳定的 `/api/*` 接口给前端。

4. **数据层（Supabase）**
   - `Supabase Auth` 管理账号密码体系。
   - `Supabase Postgres` 存储业务数据。
   - `RLS` 保障用户私有数据隔离。

整体数据流如下：

1. 用户在前端完成注册、登录、忘记密码或重置密码。
2. Supabase Auth 返回 session。
3. 前端带着当前登录态调用 `Vercel Functions`。
4. Function 校验用户身份后访问 Supabase Postgres。
5. Function 返回标准化数据给前端页面。

### 4.1 认证与会话传递契约

为避免前端、BFF 和数据库的鉴权边界混乱，本项目采用以下约定：

1. 前端登录成功后，从 Supabase session 中读取 `access_token`。
2. 受保护的业务请求统一携带 `Authorization: Bearer <access_token>` 请求头。
3. 对于支持匿名访问但可返回个性化结果的公共接口（如 `GET /api/quotes`）：
   - 未登录时不携带 token，返回匿名结果
   - 已登录时应携带 token，以便服务端返回当前用户视角的 `viewerState`
   - 若携带了非法或过期 token，接口返回 `401`，不自动降级为匿名结果
4. `Vercel Functions` 收到请求后，按路由类型使用三类 Supabase client：
   - **匿名态 client**
     - 使用 `anon key`
     - 适用于未携带 `Authorization` 的公共读取请求，如匿名访问 `GET /api/quotes`
   - **用户态 client**
      - 使用 `anon key + 用户 JWT`
      - 适用于 `favorites / heartbeats / reflections / profile`，以及携带有效 JWT 的 `GET /api/quotes`
      - 依赖 RLS 保证用户只能访问自己的数据
   - **服务端 client**
     - 使用 `service-role key`
     - 仅用于受控服务端写操作，例如后台管理接口或定时任务写入 `quotes`
5. 不允许前端直接持有 `service-role key`。
6. 前端不直接访问数据库表，所有业务读写统一通过 `/api/*` 完成。

该约定保证：

1. 用户私有数据依赖 JWT + RLS 隔离。
2. 服务端托管的数据写入不暴露高权限密钥。
3. 公共接口在登录态下也能稳定返回个性化字段。
4. API 层与数据库权限模型保持一致。

---

## 5. 页面设计

本次仅拆分为四个一级页面，不将当前所有弹层都提升为一级路由。

### 5.1 首页 `/`

职责：

- 展示金句流。
- 支持上下滚动切换当前金句。
- 支持心动、收藏、打开感悟面板、打开样式编辑面板、导出当前卡片。
- 保留当前沉浸式浏览体验。

保留为局部功能而非一级页面的能力：

- `QuoteDetailModal`
- `ReflectionPanel`
- `StyleEditorDrawer`

### 5.2 分类页 `/categories`

职责：

- 按分类、作者、歌手浏览金句。
- 支持搜索与筛选。
- 支持服务端触发获取一言内容。

建模约定：

- 分类页中的“作者”和“歌手”不拆成独立实体表，本期采用轻量字段建模。
- `quotes` 保留 `author` 作为展示名称，并新增 `author_role` 字段区分 `author / singer / unknown`。
- 分类页按 `author_role` 过滤后展示“作者”或“歌手”浏览结果。

### 5.3 收藏页 `/favorites`

职责：

- 展示当前用户收藏的金句。
- 支持按分类分组。
- 支持画廊/列表视图切换。
- 支持进入金句详情与二次操作。

### 5.4 设置页 `/settings`

职责：

- 展示当前账号信息与登录状态。
- 管理主题偏好。
- 提供登出入口。
- 提供进入登录、注册和忘记密码流程的入口。

说明：

- `ResetPasswordPage` 仅用于用户点击邮件回链后的密码重置场景，不作为设置页直接入口。

---

## 6. 前端目录结构

建议将当前单文件拆分为以下结构：

```text
src/
  app/
    router.tsx
    providers.tsx
    layout/
      AppShell.tsx
      BottomNav.tsx
  pages/
    home/
      HomePage.tsx
      components/
    categories/
      CategoriesPage.tsx
      components/
    favorites/
      FavoritesPage.tsx
      components/
    settings/
      SettingsPage.tsx
      components/
    auth/
      LoginPage.tsx
      RegisterPage.tsx
      ForgotPasswordPage.tsx
      ResetPasswordPage.tsx
  components/
    quote/
      QuoteCard.tsx
      QuoteActions.tsx
      QuoteDetailModal.tsx
    reflection/
      ReflectionPanel.tsx
    style/
      StyleEditorDrawer.tsx
    common/
      LoadingScreen.tsx
      EmptyState.tsx
      SearchBar.tsx
  hooks/
    useAuth.ts
    useQuotes.ts
    useFavorites.ts
    useTheme.ts
  services/
    api/
      client.ts
      quotes.ts
      favorites.ts
      heartbeats.ts
      reflections.ts
      profile.ts
    supabase/
      browser.ts
      session.ts
  types/
    quote.ts
    user.ts
    api.ts
  utils/
    cn.ts
    export-image.ts
    format.ts
  constants/
    quote-style.ts
    categories.ts
```

设计原则：

1. `App.tsx` 只负责应用壳层，不再承载具体业务页面。
2. 页面只消费 hooks 和 services，不直接拼接数据库访问逻辑。
3. 共享交互组件从页面中剥离，保证可复用和可测试。

---

## 7. 认证设计

认证从 Firebase Google 登录切换为 `Supabase Auth` 的账号密码体系。

包含完整流程：

1. 注册
2. 登录
3. 忘记密码
4. 重置密码

设计决策：

1. **认证流程由前端直接调用 Supabase Auth SDK**
   - 注册
   - 登录
   - 登出
   - 忘记密码邮件发送
   - 重置密码

2. **业务数据不直接由前端访问数据库**
   - 收藏、心动、感悟、个人资料等业务数据统一经由 `Vercel Functions`

原因：

1. 认证是 Supabase 已提供的成熟能力，前端直连链路更短。
2. 业务接口经由 BFF，后续演进更可控。

---

## 8. 数据模型设计

### 8.1 `profiles`

作用：
- 补充 `auth.users` 之外的业务资料和偏好信息。

字段建议：

- `id uuid primary key`
- `email text`
- `display_name text`
- `avatar_url text`
- `theme_mode text default 'light'`
- `created_at timestamptz`
- `updated_at timestamptz`

约束与建档时机：

- `profiles.id references auth.users(id) on delete cascade`
- `profiles.id` 与 `auth.users.id` 强绑定。
- 首次带有效 JWT 调用 `GET /api/profile` 或 `PATCH /api/profile` 时，服务端使用用户态 client 懒创建默认档案。
- 懒创建必须使用幂等补建策略：先按 `auth.uid()` 插入默认 profile，并使用 `on conflict do nothing` 或等价方案，再读取返回。
- `GET /api/profile` 在发现 profile 缺失时，基于当前认证用户信息自动创建默认档案并返回。
- `PATCH /api/profile` 允许对现有档案更新；若档案缺失，服务端先按默认值幂等补建再更新。

### 8.2 `quotes`

作用：
- 存储金句主数据。

字段建议：

- `id uuid primary key`
- `content text not null`
- `author text not null`
- `author_role text default 'unknown'`
- `source text`
- `category text`
- `source_type text`
- `created_by uuid null`
- `created_at timestamptz`
- `updated_at timestamptz`

说明：
- `source_type` 用于标记来源，如 `seed / hitokoto / manual`。
- `author_role` 用于支撑“作者/歌手”双维度浏览，本期取值限定为 `author / singer / unknown`。
- 数据库迁移脚本需为 `author_role` 增加 `CHECK` 约束或等价 enum 约束。

### 8.3 `favorites`

作用：
- 存储用户与金句的收藏关系。

字段建议：

- `id uuid primary key`
- `user_id uuid not null`
- `quote_id uuid not null`
- `created_at timestamptz`

约束：

- `unique(user_id, quote_id)`

### 8.4 `heartbeats`

作用：
- 存储用户对某条金句的“心动”累计记录。

字段建议：

- `id uuid primary key`
- `user_id uuid not null`
- `quote_id uuid not null`
- `count integer not null default 0`
- `last_liked_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

约束：

- `unique(user_id, quote_id)`

### 8.5 `reflections`

作用：
- 存储用户围绕某条金句写下的感悟。

字段建议：

- `id uuid primary key`
- `user_id uuid not null`
- `quote_id uuid not null`
- `content text not null`
- `created_at timestamptz`
- `updated_at timestamptz`

隐私约定：

- `reflections` 为当前登录用户私有数据，不对其他用户公开。
- 页面文案应优先表达为“我的感悟”而不是“全站感悟”。

---

## 9. RLS 权限设计

### `quotes`

- 允许匿名读取和已登录读取。
- 默认不开放普通用户直接写入。
- 写操作由服务端角色或受控后台执行。

### `profiles`

- 用户只能读取、插入和更新自己的资料。
- `insert` policy 仅允许用户以自己的 `auth.uid()` 创建一条 profile。
- `profiles.id` 必须等于当前用户的 `auth.uid()`。

### `favorites`

- 用户只能读取和写入自己的收藏数据。

### `heartbeats`

- 用户只能读取和写入自己的心动记录。

### `reflections`

- 用户只能读取和写入自己的感悟数据。

---

## 10. 接口设计

建议的 `Vercel Functions` 业务接口如下。

约定：

1. 所有响应返回 JSON。
2. 对于用户私有接口，未携带有效 JWT 返回 `401`。
3. 公共接口允许匿名访问；若请求显式携带 JWT，则服务端按登录态处理。显式携带的 JWT 非法或过期时返回 `401`。
4. 参数错误返回 `400`，资源不存在返回 `404`，业务冲突返回 `409`，第三方服务异常返回 `502`，服务内部错误返回 `500`。
5. 对于重复请求，收藏接口保证幂等，心动接口保证“单次请求最多 +1”。
6. 首页和收藏页依赖的当前用户视角状态，不单独拆读接口，而是由列表接口内联返回。

### 金句相关

- `GET /api/quotes`
  - 获取首页或分类页所需的金句列表。
  - `auth required`: 否
  - `query`: `category?`, `author?`, `authorRole?`, `keyword?`, `page?`, `pageSize?`
  - `success`: `{ items, page, pageSize, total }`
  - `items[*]`: 包含基础 quote 字段；当请求携带有效 JWT 时，额外返回 `viewerState`，字段至少包括 `{ isFavorited, viewerHeartbeatCount }`，其中 `viewerHeartbeatCount` 表示当前用户对该 quote 的累计心动次数，不是全站总热度
  - `errors`: `400`, `401`
  - `behavior`: 未携带 token 时返回匿名结果；显式携带无效或过期 token 时优先返回 `401`，不降级为匿名结果，也不继续做业务查询参数校验
  - `400 cases`: 非法 `page/pageSize`、不支持的 `authorRole`、非法筛选组合

- `POST /api/quotes/fetch-hitokoto`
  - 由服务端拉取一言接口并做标准化返回。
  - `auth required`: 否
  - `body`: `{ category?: string }`
  - `success`: `{ quote }`
  - `errors`: `400`, `502`

说明：

- 该接口在本期为只读聚合接口，不向 `quotes` 表写入数据。
- 若后续需要做服务端入库，应新增受保护的后台或定时任务接口，而不是复用匿名可访问接口。

### 收藏相关

- `GET /api/favorites`
  - 获取当前用户收藏列表。
  - `auth required`: 是
  - `query`: `category?`, `page?`, `pageSize?`
  - `success`: `{ items, page, pageSize, total }`
  - `items[*]`: 返回 quote 基础字段，并包含 `viewerState: { isFavorited: true, viewerHeartbeatCount }`，其中 `viewerHeartbeatCount` 表示当前用户对该 quote 的累计心动次数，不是全站总热度
  - `errors`: `401`

- `POST /api/favorites/:quoteId`
  - 收藏指定金句。
  - `auth required`: 是
  - `success`: `{ favorited: true }`
  - `idempotency`: 已收藏再次调用仍返回成功
  - `errors`: `401`, `404`

- `DELETE /api/favorites/:quoteId`
  - 取消收藏。
  - `auth required`: 是
  - `success`: `{ favorited: false }`
  - `idempotency`: 未收藏时调用仍返回成功
  - `errors`: `401`

### 心动相关

- `POST /api/heartbeats/:quoteId`
  - 对指定金句增加一次心动计数。
  - `auth required`: 是
  - `success`: `{ quoteId, count }`
  - `errors`: `401`, `404`

### 感悟相关

- `GET /api/reflections?quoteId=...`
  - 获取当前用户在某条金句下的感悟列表。
  - `auth required`: 是
  - `query`: `quoteId`
  - `success`: `{ items }`
  - `errors`: `400`, `401`

- `POST /api/reflections`
  - 新增感悟记录。
  - `auth required`: 是
  - `body`: `{ quoteId, content }`
  - `success`: `{ reflection }`
  - `errors`: `400`, `401`, `404`

### 资料相关

- `GET /api/profile`
  - 获取当前用户资料。
  - `auth required`: 是
  - `success`: `{ profile }`
  - `errors`: `401`
  - `behavior`: 若当前用户无 profile 记录，则自动创建默认 profile 后返回

- `PATCH /api/profile`
  - 更新当前用户资料或偏好。
  - `auth required`: 是
  - `body`: `{ displayName?, avatarUrl?, themeMode? }`
  - `success`: `{ profile }`
  - `errors`: `400`, `401`
  - `behavior`: 若 profile 缺失，服务端先补建默认 profile 再更新

### 认证相关前端流程

以下流程不通过 `Vercel Functions`，由前端直接调用 Supabase Auth SDK：

- 注册：邮箱 + 密码
- 登录：邮箱 + 密码
- 忘记密码：发送重置邮件
- 重置密码：通过邮件链接完成密码更新

异常流要求：

1. 重置密码链接失效或过期时，页面需要提示用户重新发起忘记密码流程。
2. 会话过期时，受保护接口统一返回 `401`，前端跳转登录页或弹出登录引导。
3. 一言接口失败时，首页和分类页展示可恢复错误提示，不中断本地已有内容浏览。
4. 非法 `quoteId`、不存在资源、重复收藏等情况必须按接口契约稳定返回。

---

## 11. 从当前实现到目标实现的映射

当前 Firebase 结构大致如下：

- `quotes`
- `users/{uid}`
- `users/{uid}/favorites`
- `users/{uid}/heartbeats`
- `users/{uid}/reflections`

迁移后改为关系型结构：

- `profiles`
- `quotes`
- `favorites`
- `heartbeats`
- `reflections`

迁移收益：

1. 用户子集合改为标准关系表，更适合 SQL 查询、分页和聚合。
2. 页面不再关心 Firestore 路径拼装。
3. 后续做统计、热度、后台筛选和运营推荐会更简单。

### 11.1 迁移策略

本期采用 **干净切换**，不做旧 Firebase 在线迁移。

明确决策：

1. 不自动迁移 Firebase Google 登录账号到 Supabase 邮箱密码账号。
2. 不自动迁移旧用户的收藏、心动和感悟数据。
3. 上线前必须完成 `quotes` 初始种子导入；如需保留历史内容，可通过脚本重新导入静态种子或已有可导出数据。
4. 上线时以新账号体系重新注册为准。

原因：

1. 认证体系从第三方登录切换到邮箱密码，自动迁移复杂度高且风险大。
2. 当前需求重点是结构重构与部署落地，而不是数据迁移项目。
3. 该决策可以显著降低实施复杂度与回滚成本。

回滚策略：

1. 新方案上线前保留原 Firebase 版本代码与环境配置。
2. 若新方案验证失败，可回退到旧部署版本。
3. 由于本期不做双写和在线迁移，回滚不涉及历史数据对账。

---

## 12. 实施顺序

本次改造按低风险顺序推进，不采用一次性推翻重写。

### 阶段 1：搭建路由骨架

1. 引入 `react-router-dom`。
2. 将 `App.tsx` 降级为应用壳层。
3. 建立四个一级页面与底部导航组件。

产出：
- 页面路由结构稳定。
- `activeTab` 被真实路由替代。

### 阶段 2：拆共享组件

从当前 `App.tsx` 提取：

- `QuoteCard`
- `QuoteActions`
- `QuoteDetailModal`
- `ReflectionPanel`
- `StyleEditorDrawer`
- `LoadingScreen`

产出：
- UI 与业务访问逻辑分离。

### 阶段 3：替换认证与数据层

1. 移除 Firebase 主链路。
2. 接入 Supabase Auth。
3. 建立登录、注册、忘记密码、重置密码页面。
4. 将收藏、心动、感悟、资料查询迁移到 `Vercel Functions + Supabase`。

产出：
- Firebase 从主流程中退出。
- 业务数据迁移到 Supabase。

### 阶段 4：部署与清理

1. 补齐 `api/` 目录中的 Vercel Functions。
2. 增加 Supabase SQL 初始化脚本。
3. 完善环境变量与部署说明。
4. 清理 Firebase 依赖与残留配置。

产出：
- 项目达到可部署状态。

---

## 13. 测试策略

当前项目只有类型检查，没有测试体系。本次改造建议补最小可用测试基线。

建议：

1. 使用 `Vitest` 作为单元测试运行器。
2. 使用 `React Testing Library` 做关键组件与页面行为测试。
3. 至少覆盖以下风险点：
   - 四个一级页面的路由进入是否正确。
   - 登录、注册、忘记密码表单校验是否正确。
   - 重置密码链接失效或过期时提示是否正确。
   - 收藏与取消收藏的状态变化是否正确。
   - 未登录状态下需要认证的交互是否正确拦截。
   - 会话过期后受保护接口是否正确回到登录流程。
   - 一言接口失败时页面是否能稳定降级。
   - 非法 `quoteId` 与空态响应是否正确处理。
   - API client 对错误响应的处理是否稳定。

快速校验链路：

- `npm run lint`
- `npm run build`

---

## 14. 文档落地

本次设计建议至少补以下落地物：

1. 当前设计文档：
   - `docs/superpowers/specs/2026-03-21-golden-app-rearchitecture-design.md`

2. 后续实施阶段的架构文档：
   - `docs/architecture/app-architecture.md`

3. 数据库脚本目录：
   - `supabase/migrations/`

其中 `app-architecture.md` 建议包含三部分：

1. 现状架构
2. 目标架构
3. 迁移路径

---

## 15. 风险与边界

### 主要风险

1. 当前 `App.tsx` 体量过大，拆分时容易引入状态回归。
2. 从 Firebase 到 Supabase 的迁移涉及认证和数据模型双重变化，不能在同一提交中做过多无关重构。
3. 当前仓库 Git 根目录位于用户目录上层，直接提交可能卷入无关文件，提交策略需要额外谨慎。

### 控制策略

1. 先拆路由与组件，再替换数据源。
2. 保持 UI 风格基本稳定，避免视觉改动与架构改动混在一起。
3. 所有数据库结构通过迁移脚本显式落地。
4. 所有认证流程通过独立页面和明确状态处理实现。

---

## 16. 结论

本次重构采用“**四个一级页面 + Supabase Auth + Postgres + Vercel Functions**”的目标架构。

这是对当前项目最合适的演进路线，因为它：

1. 解决了单文件结构失控的问题。
2. 统一了认证方式与部署方式。
3. 建立了清晰的前端、BFF 和数据层边界。
4. 为后续功能扩展提供了稳定基础。

下一步应基于本设计文档编写实施计划，再进入代码改造阶段。

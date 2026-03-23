# 金句 App 架构说明

## 当前架构

- 前端框架：`Vite + React 19 + TypeScript`
- 页面路由：`React Router`
- 当前一级页面：
  - `/`
  - `/categories`
  - `/favorites`
  - `/settings`
- 认证页面：
  - `/auth/login`
  - `/auth/register`
  - `/auth/forgot-password`
  - `/auth/reset-password`

当前代码结构已经具备以下基础边界：

- `src/App.tsx`
  - 只负责挂载 `AppProviders + AppRouter`
- `src/app/*`
  - 承担应用壳层、布局和路由定义
- `src/pages/*`
  - 按页面拆分为独立文件
- `src/services/supabase/*`
  - 浏览器端 Supabase client 与 session 辅助
- `src/services/api/*`
  - 前端统一业务 API client
- `api/*`
  - Vercel Functions BFF，负责业务接口与身份校验
- `src/hooks/useAuth.ts`
  - 统一封装账号密码登录、注册、忘记密码和重置密码

## 目标架构

目标架构采用 `前端页面层 + Vercel Functions BFF + Supabase Auth/Postgres` 三层模型。

### 前端

- 页面只负责展示和交互
- 认证流程直接调用 `Supabase Auth`
- 业务数据统一通过 `/api/*` 访问
- 用户私有状态通过 JWT 驱动

### Vercel Functions

- 对外提供稳定的业务接口
- 负责身份校验和参数校验
- 屏蔽数据库细节与 RLS 细节
- 为首页和收藏页聚合 `viewerState`
- `api/*` 目录运行时代码统一使用相对导入 + `.js` 扩展名，不使用 `@/...` 别名

### Supabase

- `Auth`
  - 账号密码注册、登录、忘记密码、重置密码
- `Postgres`
  - `profiles`
  - `quotes`
  - `favorites`
  - `heartbeats`
  - `reflections`
- `RLS`
  - 保证用户只能访问自己的私有数据

## 数据流

### 认证流

1. 用户在前端发起注册或登录
2. 前端调用 `supabase.auth.*`
3. Supabase 返回 `session`
4. 前端从 session 读取 `access_token`
5. 受保护业务请求携带 `Authorization: Bearer <token>`

### 业务流

1. 前端调用 `Vercel Functions`
2. Function 解析并校验 token
3. Function 使用匿名、用户态或 service-role Supabase client
4. Function 访问 Postgres 并返回标准化 JSON

## API 面

当前已经落地的核心接口如下：

- `GET /api/quotes`
- `POST /api/quotes/fetch-hitokoto`
- `GET /api/favorites`
- `POST /api/favorites/:quoteId`
- `DELETE /api/favorites/:quoteId`
- `POST /api/heartbeats/:quoteId`
- `GET /api/reflections?quoteId=...`
- `POST /api/reflections`
- `GET /api/profile`
- `PATCH /api/profile`

## 数据库概览

### `profiles`

- 绑定 `auth.users.id`
- 存储展示名、头像、主题偏好

### `quotes`

- 存储金句主数据
- 包含 `author_role` 与 `source_type`

### `favorites`

- 用户收藏关系表
- `unique(user_id, quote_id)`

### `heartbeats`

- 用户对单条金句的累计心动记录
- `unique(user_id, quote_id)`

### `reflections`

- 用户对单条金句的感悟文本

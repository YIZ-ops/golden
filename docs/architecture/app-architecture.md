# 金句 App 架构说明

## 当前架构

截至 2026-03-21，项目已经完成从 Firebase 单文件实现向 `Supabase Auth + Postgres + Vercel Functions` 的主链路迁移：

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

旧的 Firebase 实现、配置和遗留依赖已经从项目中移除。

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

## 迁移路径

本次重构按以下顺序完成：

1. 拆出路由壳层和四个一级页面
2. 补齐测试基建与路由 smoke test
3. 接入 Supabase 浏览器端认证
4. 增加数据库 migration、seed 和 RLS
5. 实现 Vercel Functions 与前端 API client
6. 逐页迁移原有首页、分类、收藏、设置逻辑
7. 清理 Firebase 依赖与旧配置

## 当前已完成

- 一级路由、应用壳层与认证页面组已拆出
- 首页、分类、收藏、设置四个一级页面已迁移到独立页面文件
- `Vitest + React Testing Library` 测试基建已接入，路由、页面与 API 层测试已覆盖
- 账号密码注册、登录、忘记密码、重置密码链路已接通
- `quotes / favorites / heartbeats / reflections / profile` 对应的 Vercel Functions 已落地
- Supabase migration、seed、环境变量模板和部署配置已落盘
- Firebase 依赖与遗留配置已清理

## 当前剩余事项

- 持续优化前端分包体积，降低构建中的大 chunk 告警
- 在真实 Supabase 环境持续执行 migration、seed 与回归验证

# 金句 App

一个基于 `Vite + React 19 + TypeScript` 的金句 Web 应用，当前已经完成从 Firebase 单文件版本到 `Supabase Auth + Postgres + Vercel Functions` 主链路的迁移。

## 当前状态

已完成：

- 四个一级页面的路由骨架
- `Vitest + React Testing Library` 测试基建
- 账号密码注册、登录、忘记密码、重置密码页面
- Supabase 浏览器端 client 与 session 辅助
- Supabase migration、seed、架构文档和 Vercel 路由配置
- 首页、分类、收藏、设置真实页面迁移
- Firebase 依赖清理

进行中：

- Vercel Functions 业务接口补强
- Vercel 生产构建联调

## 技术栈

- React 19
- TypeScript
- Vite
- React Router
- Supabase Auth
- Supabase Postgres
- Vercel Functions
- Vitest
- React Testing Library

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

参考 [.env.example](/C:/Users/14798/Desktop/金/.env.example) 创建本地环境文件，并填入：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. 启动前端

```bash
npm run dev
```

### 4. 测试与构建

```bash
npm test
npm run lint
npm run build
```

## Supabase 初始化

数据库资产位于 [supabase](/C:/Users/14798/Desktop/金/supabase)。

建议步骤：

```bash
supabase start
supabase db reset
```

当前 migration：

- [20260321_initial_schema.sql](/C:/Users/14798/Desktop/金/supabase/migrations/20260321_initial_schema.sql)

当前 seed：

- [seed.sql](/C:/Users/14798/Desktop/金/supabase/seed.sql)

## 部署到 Vercel

### 前提

- 已创建 Supabase 项目
- 已在 Vercel 项目中配置环境变量
- Supabase Auth 的 Site URL 与重置密码回跳地址已正确配置

### 需要的环境变量

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 构建检查

```bash
npm run build
```

前端 SPA 重写配置见 [vercel.json](/C:/Users/14798/Desktop/金/vercel.json)。

## 架构文档

- [app-architecture.md](/C:/Users/14798/Desktop/金/docs/architecture/app-architecture.md)
- [2026-03-21-golden-app-rearchitecture-design.md](/C:/Users/14798/Desktop/金/docs/superpowers/specs/2026-03-21-golden-app-rearchitecture-design.md)
- [2026-03-21-golden-app-rearchitecture.md](/C:/Users/14798/Desktop/金/docs/superpowers/plans/2026-03-21-golden-app-rearchitecture.md)

## 当前限制

- 仍有一个 CSS `@import` 顺序告警
- 打包产物仍有 `>500kB` 的 chunk size 告警
- 还没有执行最终的 `npx vercel build` 联调验证

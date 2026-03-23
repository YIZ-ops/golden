# 金句 App

一个基于 `Vite + React 19 + TypeScript` 的金句 Web 应用
 `Supabase Auth + Postgres + Vercel Functions` 主链路


## 技术栈

- React 19
- TypeScript
- Vite
- React Router

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

### Vercel Functions（Node.js Runtime）注意事项

为避免部署后出现 `ERR_MODULE_NOT_FOUND`（如 `Cannot find module '../_lib/http'` 或 `Cannot find package '@/constants'`），请遵循：

1. `api/*` 下的运行时代码不要使用 TS 路径别名（`@/...`），统一使用相对路径。
2. `api/*` 下的相对导入要显式带 `.js` 扩展名（例如 `../_lib/http.js`、`./query.js`）。
3. 以上规则仅针对 Vercel Function 运行时代码；前端 `src/*` 保持 `@/...` 别名不受影响。
4. 每次修改 API 导入后，先本地执行 `npm run build` 再部署。

原因：Vercel Node.js Runtime 对 TypeScript Path Mapping（`paths`/`baseUrl`）不做运行时解析，且 ESM 相对导入需要可解析的文件扩展名。

## 架构文档

- [app-architecture.md](/C:/Users/14798/Desktop/金/docs/architecture/app-architecture.md)
- [2026-03-21-golden-app-rearchitecture-design.md](/C:/Users/14798/Desktop/金/docs/superpowers/specs/2026-03-21-golden-app-rearchitecture-design.md)
- [2026-03-21-golden-app-rearchitecture.md](/C:/Users/14798/Desktop/金/docs/superpowers/plans/2026-03-21-golden-app-rearchitecture.md)

## 当前限制

- 打包产物仍可能出现 `>500kB` 的 chunk size 告警，建议继续做更细粒度分包

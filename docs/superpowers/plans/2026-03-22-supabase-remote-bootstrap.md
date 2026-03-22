# Supabase Remote Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目本地环境连接到指定的 Supabase 项目，并把远程 Postgres 初始化到当前仓库的 schema 与 seed 状态。

**Architecture:** 保持现有前后端环境变量命名不变，只替换 `.env` 的真实值，并增加 Postgres 直连串供初始化脚本使用。通过一个一次性 Node 脚本读取仓库内 SQL 文件，直连远程数据库执行 migration 与 seed，再用现有测试和构建命令做最小验证。

**Tech Stack:** Vite, React 19, TypeScript, Supabase, PostgreSQL, Node.js

---

## Chunk 1: Configuration And Bootstrap

### Task 1: 更新环境变量文件

**Files:**
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: 写入本地真实环境变量**
- [ ] **Step 2: 保留示例文件为无密钥占位格式**
- [ ] **Step 3: 确认前端变量使用 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`**
- [ ] **Step 4: 确认服务端变量使用 `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`**

### Task 2: 增加远程数据库初始化脚本

**Files:**
- Create: `scripts/init-remote-db.mjs`
- Modify: `package.json`

- [ ] **Step 1: 添加读取 SQL 文件并顺序执行 migration/seed 的脚本**
- [ ] **Step 2: 为脚本补充最小运行入口命令**
- [ ] **Step 3: 依赖缺失时补齐 Postgres 驱动**

## Chunk 2: Remote Initialization And Verification

### Task 3: 初始化远程数据库

**Files:**
- Read: `supabase/migrations/20260321_initial_schema.sql`
- Read: `supabase/seed.sql`

- [ ] **Step 1: 运行远程初始化脚本**
- [ ] **Step 2: 确认 migration 与 seed 都执行成功**

### Task 4: 做最小验证

**Files:**
- Test: `npm test`
- Test: `npm run build`

- [ ] **Step 1: 运行测试套件**
- [ ] **Step 2: 运行构建命令**
- [ ] **Step 3: 汇总结果与残余风险**

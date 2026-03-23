# Settings MVP Design

**Date:** 2026-03-22

**Goal:** 在现有 `/settings` 页面内补齐“个人资料、主题偏好、账号安全”三类能力，并做到前后端真实闭环。

## Existing Context

- 前端设置页位于 `src/pages/settings/SettingsPage.tsx`
- 用户资料读取与更新通过 `src/services/api/profile.ts` 对接 `GET/PATCH /api/profile`
- 认证能力由 `src/hooks/useAuth.ts` 提供，已具备 `updatePassword()`
- 后端 `api/profile.ts` 已支持 `displayName`、`avatarUrl`、`themeMode`，但当前 patch 语义不足以支持“部分更新”和“显式清空”
- 当前主题偏好仅写入 profile，尚未驱动页面实际主题

## Scope

本次只做最小可用闭环，不做路由拆分，不引入新的后端服务，不做头像上传。

### 1. 个人资料

- 用户可编辑 `displayName`
- 用户可编辑 `avatarUrl`
- 保存后立即刷新设置页顶部的账号展示
- `avatarUrl` 为空时展示首字母头像

### 2. 使用偏好

- 保留 `light` / `dark` / `system`
- 主题切换不仅持久化到 profile，还要立即作用到页面
- `system` 需跟随操作系统深浅模式变化

### 3. 账号安全

- 已登录用户可在设置页直接修改密码
- 表单包含“新密码 / 确认新密码”
- 成功后清空输入并提示成功

### 4. 未登录态

- 保持现有登录、注册、忘记密码入口
- 不展示资料编辑、主题保存、修改密码表单

## UX Structure

设置页保持单页结构，拆成三个区块：

1. `AccountSummary`
   - 展示头像、昵称、邮箱、退出登录按钮
2. `ProfileForm`
   - 编辑 `displayName` 与 `avatarUrl`
   - 提供保存按钮和提交反馈
3. `PreferenceSection`
   - 切换主题并立即生效
4. `SecuritySection`
   - 修改密码

注：是否抽子组件交由实现阶段根据文件长度决定，但职责边界按以上四块划分。

## Data Flow

### Profile

1. 进入设置页
2. 调用 `getProfile()`
3. 用返回结果填充顶部账号信息与资料表单
4. 用户保存资料时，仅提交变更字段
5. `PATCH /api/profile` 返回最新 profile
6. 页面同步更新 summary 与表单基线值

### Theme

1. 应用层读取 theme mode
2. 将 mode 转为实际主题：
   - `light` -> light
   - `dark` -> dark
   - `system` -> 跟随 `prefers-color-scheme`
3. 设置页切换主题时先本地应用，再调用 profile patch 持久化
4. 若保存失败，则回滚到旧主题并展示错误

### Password

1. 用户输入新密码与确认密码
2. 前端先做一致性与长度校验
3. 调用 `useAuth().updatePassword()`
4. 成功后清空表单并显示成功提示

## API Changes

`PATCH /api/profile` 需要从“值导向”改为“字段存在性导向”。

当前问题：

- 未传字段会被写成 `null`
- 空字符串会被视作“字段无效”，导致无法清空昵称或头像

目标行为：

- 只更新请求中出现的字段
- `displayName: ""` 或 `avatarUrl: ""` 表示显式清空，落库为 `null`
- `themeMode` 仍只允许 `light | dark | system`
- 请求体中三个字段都不存在时，返回 `400 INVALID_PROFILE_PATCH`

## Error Handling

- `GET /api/profile` 或 `PATCH /api/profile` 返回 401：清 session 并跳转登录
- profile 保存失败：保留当前输入内容，展示错误
- theme 保存失败：回滚视觉主题和本地状态
- password 校验失败：前端直接阻止提交
- password 接口失败：保留输入，展示错误
- avatar 加载失败：回退为首字母头像，不做额外网络探测

## Testing Strategy

必须按 TDD 执行，至少覆盖以下行为：

- 未登录设置页展示登录入口
- 已登录设置页加载 profile 并渲染 summary / form 初始值
- 保存资料时发送正确 payload，并在成功后刷新展示
- 切换主题时立即生效，持久化失败时回滚
- 密码不一致时阻止提交
- 修改密码成功后清空表单并展示成功提示
- `api/profile` 允许部分更新
- `api/profile` 允许通过空字符串显式清空资料字段

## Non-Goals

- 头像文件上传
- 多页面设置中心
- 新增全局状态库
- 管理员专属设置
- 复杂图片可用性校验

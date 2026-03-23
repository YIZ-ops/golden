# Favorites Manual Quote Design

**Date:** 2026-03-23

**Goal:** 在收藏夹页增加一个右下角“写”入口，允许用户手动录入句子并直接保存到指定收藏夹。

## Existing Context

- 收藏夹 Tab 页面位于 `src/pages/favorites/FavoritesPage.tsx`
- 当前页面已有“新建收藏夹”按钮和底部抽屉交互模式
- 收藏夹数据由 `src/services/api/favorites.ts` 提供，支持拉取收藏夹、创建收藏夹、将已有 quote 加入收藏夹
- 当前系统还没有“手动创建 quote”的前端 API 和后端接口
- `Quote` 类型已经支持 `sourceType: 'seed' | 'hitokoto' | 'manual'`
- `GET /api/quotes` 已经会返回 `sourceType`、`source`、`category` 等字段，说明 `quotes` 主表已经具备复用空间

## Scope

本次只做收藏夹页内的最小可用闭环，不做新的独立页面，不做复杂富文本输入，不做批量导入。

### 1. 收藏页右下入口

- 在收藏夹 Tab 页面右下角增加一个悬浮“写”图标按钮
- 点击后打开底部抽屉

### 2. 手动添加句子抽屉

抽屉字段如下：

- 必填
  - `句子内容`
  - `作者`
  - `收藏夹`
- 可选
  - `来源`
  - `分类`

### 3. 提交行为

- 先创建一条 `manual` 类型的 quote
- 再将这条新 quote 收藏到用户选中的收藏夹
- 成功后关闭抽屉、清空表单、刷新收藏夹列表

## Recommended Approach

推荐方案是“先创建自定义 quote，再复用现有收藏接口加入收藏夹”。

原因：

- 保持 quote 与 favorite 的模型统一
- 后续这类手写句子可以在现有 quote 展示链路中复用
- 避免把“收藏夹私有条目”做成与 `quotes` 主表并行的第二套结构

不采用以下方案：

- 只在收藏夹内部存私有文本项
- 前端伪造 quote id 再调用现有收藏接口

## UX Structure

### 收藏夹页主界面

- 保留现有“新建收藏夹”入口
- 新增一个固定在右下角的悬浮“写”图标按钮
- “写”图标按钮不替代新建收藏夹按钮，两者各自承担独立操作

### 手动添加句子抽屉

抽屉结构：

1. 标题：`添加句子`
2. 字段：
   - 句子内容 textarea
   - 作者 input
   - 来源 input
   - 分类 input
   - 收藏夹选择器
3. 底部主按钮：`保存`

抽屉交互规则：

- 点击悬浮按钮打开
- 点击遮罩关闭
- 点击“关闭”关闭
- 保存成功后自动关闭
- 保存失败时保持打开并显示错误
- 抽屉打开时页面背景锁定滚动，关闭后恢复

## Data Flow

### Frontend

1. 用户进入收藏夹页，页面拉取收藏夹列表
2. 用户点击右下角“写”按钮
3. 页面打开“添加句子”抽屉
4. 用户填写表单并提交
5. 前端先做必填校验
6. 前端调用新建 quote API
7. 前端拿到新 quote id 后，调用现有 favorite API，将其加入指定收藏夹
8. 成功后关闭抽屉、清空表单、刷新收藏夹列表

### Backend

新增一个创建 quote 的接口：

- `POST /api/quotes`

请求体：

- `content: string`
- `author: string`
- `folderId: string` 不放在创建 quote 接口里，由前端下一步交给 favorite API
- `source?: string`
- `category?: string`

返回：

- 至少返回新建 quote 的 `id`

创建的 quote 需要满足：

- `source_type = 'manual'`
- 保留 `content`、`author`、`source`、`category`
- 记录 `created_by` 或现有可追踪用户字段（若表结构已支持）

## Validation Rules

### Frontend Validation

- `句子内容`：trim 后不能为空
- `作者`：trim 后不能为空
- `收藏夹`：必须选择
- `来源`：可空
- `分类`：可空

### Backend Validation

- `content`、`author` 必须为非空字符串
- `source`、`category` 若传入，需标准化为 trim 后字符串，空字符串按 `null` 处理
- 未登录请求返回 401

## Error Handling

- 创建 quote 失败：不执行收藏，抽屉内显示错误
- 创建成功但收藏失败：抽屉内显示错误，保留用户输入
- 收藏夹列表获取失败：沿用当前 favorites 页错误展示
- 401：沿用当前页面逻辑，清 session 并跳转登录
- 表单校验失败：前端阻止提交，不发请求

## Files Expected To Change

- `src/pages/favorites/FavoritesPage.tsx`
- `src/pages/favorites/FavoritesPage.test.tsx`
- `src/services/api/quotes.ts`
- `api/quotes/index.ts`

可能需要辅助更新：

- `src/types/quote.ts`
- `docs/architecture/app-architecture.md`

是否需要新增专用组件，交由实现阶段根据文件体量决定。

## Testing Strategy

必须按 TDD 执行，至少覆盖以下行为：

- 收藏夹页渲染右下角“写”图标入口
- 点击后打开“添加句子”抽屉
- 必填项缺失时阻止提交
- 提交时先创建 quote，再执行收藏
- 成功后关闭抽屉并刷新收藏夹列表
- 创建 quote 失败时不执行收藏
- 收藏失败时显示错误
- 点击遮罩可关闭抽屉

## Non-Goals

- 批量导入句子
- 富文本编辑
- 图片附件
- 单独的“我写的句子”页面
- 分类枚举管理

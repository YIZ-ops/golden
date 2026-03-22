# 分类页人物化改版设计文档

**日期：** 2026-03-22  
**项目：** Golden 金句 App  
**主题：** 分类页 UI 精简、作者/歌手入口数据库化、人物实体建模与内容导入方案

---

## 1. 背景

当前分类页已经具备三种入口能力：

1. 一言分类入口
2. 作者入口
3. 歌手入口

但现状存在三个明显问题：

1. 页面顶部存在两张说明性质卡片，信息密度低，占据主要视觉空间。
2. “作者”和“歌手”入口不是从数据库读取，而是前端常量写死，和真实内容库不一致。
3. 当前 `quotes` 表中作者和歌手入口依赖静态常量，和真实内容库脱节，后续扩库维护成本高。

本次改版不做完整后台或复杂内容管理系统，只聚焦分类页最小可落地重构。

---

## 2. 目标

本次改版目标如下：

1. 去掉分类页顶部 `Discover` 卡片。
2. 去掉结果区顶部 `Matches / 从一个入口开始` 卡片式头部。
3. 分类页中的作者、歌手入口不再由前端常量维护，而是由数据库自动聚合。
4. 为真实作者与真实歌手建立清晰的数据模型，避免人物维度继续混乱。
5. 为后续批量补充真实可核验内容提供可扩展的导入链路。

非目标：

1. 不在本次改版中构建完整内容后台。
2. 不在本次改版中实现复杂排序、推荐、热度算法。
3. 不在本次改版中一次性导入大规模歌词文本。
4. 不在本次改版中引入重型 CMS 或外部采集系统。

---

## 3. 方案选择

### 3.1 已讨论方案

**方案 A：继续只用 `quotes.author` 单字段**

- 作者和歌手入口都从 `quotes.author` 聚合
- 不新增实体表

问题：

- 作者和歌手都会继续混在字符串字段上，后续维护困难
- 后续真实数据一多，入口语义会持续恶化

**方案 B：在歌曲类内容上增加 `performer` 字段**

- 作者继续使用 `author`
- 歌手入口使用 `performer`

优点：

- 比方案 A 清晰
- 改动相对可控

问题：

- 依然是“字段补丁式”扩展
- 当作品涉及多人关系时，表达能力不足

**方案 C：引入人物与作品轻量实体**

- 人物单独建模
- 作品单独建模
- 金句绑定到人物和作品
- 歌曲直接归属到歌手本人，不再额外区分作词、作曲

### 3.2 最终选择

采用 **方案 C：引入人物与作品轻量实体**。

原因：

1. 能从根本上解决“人物入口静态写死”和“查询靠名字字符串匹配”的问题。
2. 更符合“库里有什么人物就自动展示什么”的产品方向。
3. 为后续补数据、修来源、去重和核验提供稳定结构。
4. 保留人物实体化，但不过度引入歌曲多角色关系建模。

---

## 4. UI 改动范围

本次分类页 UI 仅做必要精简，不做大幅视觉重设计。

### 4.1 移除内容

1. 移除 [src/pages/categories/CategoriesPage.tsx](/C:/Users/14798/Desktop/金/src/pages/categories/CategoriesPage.tsx) 顶部 `Discover / 分类` 说明卡。
2. 移除 [src/pages/categories/components/CategoryQuoteGrid.tsx](/C:/Users/14798/Desktop/金/src/pages/categories/components/CategoryQuoteGrid.tsx) 中的 `Matches / 从一个入口开始` 结果头部说明卡。

### 4.2 保留内容

1. 搜索区
2. 一言分类入口区
3. 作者入口区
4. 歌手入口区
5. 结果列表区
6. 空态、错误态、加载态

### 4.3 交互意图

页面进入后直接看到可操作入口，而不是先看到两段解释文案。  
分类页视觉重心应从“介绍这个页面是什么”切换为“立刻开始筛选和浏览”。

---

## 5. 数据模型设计

为支持真实作者与真实歌手的稳定建模，引入三张核心表。

### 5.1 `people`

作用：

- 统一承载分类页中的“作者”和“歌手”人物实体。

字段建议：

- `id uuid primary key`
- `name text not null`
- `role text not null`
- `aliases text[] null`
- `bio text null`
- `created_at timestamptz`
- `updated_at timestamptz`

约束建议：

- `role` 取值限定为 `author / singer`
- `name + role` 建唯一约束

### 5.2 `works`

作用：

- 存储书籍、歌曲、访谈、演讲等作品信息。

字段建议：

- `id uuid primary key`
- `title text not null`
- `work_type text not null`
- `published_at date null`
- `created_at timestamptz`
- `updated_at timestamptz`

约束建议：

- `work_type` 取值限定为 `book / song / speech / interview / essay / other`

### 5.3 `quotes`

作用：

- 存储可展示的金句正文。

字段建议：

- `id uuid primary key`
- `content text not null`
- `person_id uuid not null`
- `work_id uuid null`
- `category text null`
- `source_type text not null`
- `excerpt_type text not null`
- `verified boolean not null default false`
- `created_by uuid null`
- `created_at timestamptz`
- `updated_at timestamptz`

说明：

- `person_id` 表示这条句子的主要展示人物
- 作者类内容的 `person_id` 指向作者
- 歌曲类内容的 `person_id` 指向歌手
- `work_id` 指向出处作品，可为空
- `source_type` 继续兼容现有 `seed / hitokoto / manual`
- `excerpt_type` 区分 `quote / lyric / prose`
- `verified` 用于标记该句子是否已经过人工核验

### 5.4 关键建模约定

1. 分类页入口的人物数据只从 `people` 读取。
2. 结果列表中展示的“作者/歌手”主名称来自 `people.name`。
3. 歌曲类内容统一按歌手归属，不区分作词、作曲等额外角色。
4. `quotes.person_id` 代表当前分类页主要浏览维度下的归属人物。

---

## 6. 接口设计

### 6.1 新增人物聚合接口

`GET /api/people`

用途：

- 为分类页“作者”“歌手”入口提供数据库驱动的人物列表。

参数建议：

- `role?`: `author | singer`
- `keyword?`
- `page?`
- `pageSize?`

返回：

- `{ items, page, pageSize, total }`

`items[*]` 字段建议：

- `id`
- `name`
- `role`
- `quoteCount`

行为要求：

1. 默认按 `quoteCount desc, name asc` 排序，优先展示库里内容更多的人物。
2. 搜索应同时匹配 `name` 和 `aliases`。
3. 仅返回至少关联一条可展示金句的人物，避免空入口。

### 6.2 扩展金句查询接口

现有 `GET /api/quotes` 扩展支持：

- `personId?`

分类页点击人物后，前端应按 `personId` 查询，而不是继续传 `author` 字符串。

返回项建议增加：

- `person: { id, name, role }`
- `work: { id, title, workType } | null`

行为要求：

1. `personId` 与旧的 `author` 字符串查询可以在过渡期并存。
2. 分类页新实现仅使用 `personId`。
3. 列表项需要能显示作品标题，便于用户理解句子出处。

### 6.3 现有一言分类接口保持不变

`POST /api/quotes/fetch-hitokoto`

本次不改变该接口职责，仍只负责分类拉取一言并标准化返回。

---

## 7. 前端改造设计

### 7.1 分类入口区

[src/pages/categories/components/CategoryFilters.tsx](/C:/Users/14798/Desktop/金/src/pages/categories/components/CategoryFilters.tsx) 需要从“本地常量驱动”改为“接口驱动”。

改造方向：

1. 保留搜索输入框。
2. 一言分类仍可继续使用本地分类常量。
3. 作者列表改为请求 `/api/people?role=author`
4. 歌手列表改为请求 `/api/people?role=singer`
5. “换一换作者 / 歌手”可保留分页轮换体验，但数据源来自接口。

### 7.2 结果列表区

[src/pages/categories/components/CategoryQuoteGrid.tsx](/C:/Users/14798/Desktop/金/src/pages/categories/components/CategoryQuoteGrid.tsx) 去掉顶部说明卡，仅保留：

1. 加载态
2. 错误态
3. 空态
4. 结果卡片列表

结果卡片建议新增展示：

- 人物名
- 分类
- 作品名（若有）

### 7.3 页面壳层

[src/pages/categories/CategoriesPage.tsx](/C:/Users/14798/Desktop/金/src/pages/categories/CategoriesPage.tsx) 去掉顶部 `Discover` 卡片后，页面首屏应直接进入筛选区。

页面状态调整建议：

1. 不再用“从一个入口开始”作为默认结果标题。
2. 默认空态直接由结果区空态组件表达。
3. 人物点击后，结果标题可改为 `作者：xxx` / `歌手：xxx`，但不再需要额外的英文 eyebrow。

---

## 8. 内容导入设计

### 8.1 总体原则

真实作者与真实歌手内容必须采用“真实人物 + 可核验句子”的策略。  
不生成伪造署名内容，不把 AI 生成句子挂到真实人物名下。

### 8.2 数据存放方式

不建议把大量内容直接堆入 [supabase/seed.sql](/C:/Users/14798/Desktop/金/supabase/seed.sql)。

推荐拆分为：

- `supabase/seed.sql`
  - 保留最小演示数据
- `supabase/seeds/people.sql`
  - 人物数据
- `supabase/seeds/works.sql`
  - 作品数据
- `supabase/seeds/quotes-curated.sql`
  - 核验后的真实句子

或者使用等价 JSON 数据文件，再由脚本转写入库。

### 8.3 导入链路

建议新增独立导入脚本，而不是继续只靠 `seed.sql`。

脚本职责：

1. 先导入 `people`
2. 再导入 `works`
3. 最后导入 `quotes`
4. 使用可重复执行的 upsert / `on conflict do nothing` 策略

### 8.4 首批规模建议

首批内容建议控制在约 120 条左右：

- 作者：8 到 12 位
- 每位作者：8 到 15 条
- 歌手：6 到 8 位
- 每位歌手：3 到 8 条

这样既能让分类页“自动聚合入口”看起来不空，又不会把首轮核验工作做成大工程。

### 8.5 歌词边界

歌手维度存在明确版权风险：

1. 大规模原文歌词不适合直接批量入库。
2. 首批可以先完成歌手实体、作品实体和少量安全样本。
3. 真正大规模歌词内容入库，需要用户提供可用语料或明确授权来源后再继续。

因此本期优先级建议为：

1. 先补作者类真实语录
2. 歌手侧先把人物结构和少量安全样本跑通

---

## 9. 测试策略

本次改动至少应补以下测试：

1. 分类页不再渲染 `Discover` 卡片。
2. 结果区不再渲染 `Matches` 头部。
3. 作者入口改为从接口加载并可搜索。
4. 歌手入口改为从接口加载并可搜索。
5. 点击人物后，前端按 `personId` 发起请求。
6. `/api/people` 支持 `role` 和 `keyword` 过滤。
7. 导入脚本可重复执行且不产生重复数据。

---

## 10. 实施顺序

建议按以下顺序推进：

1. 数据库 migration：新增 `people / works`，并为 `quotes` 增加外键与兼容字段迁移策略
2. 服务端接口：新增 `/api/people`，扩展 `/api/quotes`
3. 分类页前端：移除两张顶部说明卡，改为接口驱动人物入口
4. 测试补齐：页面行为、接口行为、导入脚本
5. 内容导入：先导入第一批核验数据

---

## 11. 结论

本次分类页改版采用以下组合策略：

1. UI 上只做必要精简，移除两张说明卡，保留核心筛选与结果内容。
2. 数据上引入 `people / works / quotes` 轻量实体模型。
3. 分类页作者、歌手入口改为完全由数据库聚合驱动。
4. 歌曲类内容统一按歌手归属，不区分作词、作曲等额外角色。
5. 内容导入采用独立 seed 文件或数据文件 + 导入脚本，不再把大批量真实内容直接写入单一 `seed.sql`。

这条路线能够同时解决当前分类页的界面冗余、入口静态化和人物语义混乱问题，并为后续稳定扩库打下基础。

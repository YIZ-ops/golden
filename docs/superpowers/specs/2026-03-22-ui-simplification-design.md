# Golden UI 简化改版设计文档

**日期：** 2026-03-22  
**项目：** Golden 金句 App  
**主题：** 统一 loading 视觉、移除非必要白色圆角卡片、删除顶部“慢慢读”卡片

---

## 1. 背景

当前前端已经形成一套偏“白色圆角卡片堆叠”的视觉语言，主要表现为：

1. 多个一级页面用 `bg-white + rounded-[2rem] + shadow` 承载说明、概览、入口和结果区域。
2. loading 态表达不统一，既有灰色圆点、骨架块，也有纯文本等待。
3. 应用壳层右上角存在一个“慢慢读”提示卡片，占用视觉注意力，但不承担实际功能。
4. 路由级 `Suspense`、页面内局部请求、认证按钮提交态、感悟面板加载态目前分别使用不同等待表达，没有形成统一规则。

这些实现虽然完整，但在移动端阅读型产品里显得偏重，页面存在较多“卡片套卡片”的感觉，和“尽量简洁一些”的目标不一致。

用户明确提出以下改动方向：

1. 所有 loading 等待都要使用 `PixelCat`。
2. 不需要使用圆角白色背景的地方不要使用，整体尽量简洁。
3. 所有 `AppShell` 内页面右上方的“慢慢来/慢慢读”卡片去掉。
4. 认证页同样适用“简洁化”和 loading 统一原则，但认证页本身并不存在该右上角卡片。

---

## 2. 目标

本次改版的目标如下：

1. 统一整个应用的 loading 表达方式，形成单一视觉语言。
2. 去掉非必要的大白底大圆角卡片，让页面层级更多依靠排版、间距、细边线和浅底区分。
3. 删除 `AppShell` 应用壳层右上角“慢慢读”装饰卡片，降低顶部噪音。
4. 在不改变业务流程、接口调用和路由结构的前提下，完成一次全局视觉瘦身。

非目标：

1. 不在本次改版中重做首页主句卡的结构。
2. 不在本次改版中重新设计底部导航、感悟抽屉、样式抽屉等核心交互组件的布局和信息架构。
3. 允许为了统一 loading 规则，修改抽屉和面板内部的等待态表达，但不扩大到其整体结构重做。
4. 不在本次改版中引入新的主题系统或色彩方案。
5. 不在本次改版中调整接口、数据模型或状态管理架构。

---

## 3. 方案选择

### 3.1 备选方案

**方案 A：仅处理明确点名问题**

- 只替换 loading
- 只删除“慢慢读”卡片
- 仅少量减少白卡

问题：

1. 页面主体仍保留大量白底大卡。
2. 视觉风格不会真正收敛。
3. 后续仍要再做一次系统性清理。

**方案 B：结构不变，视觉整体瘦身**

- 保留现有页面结构和信息架构
- 统一 loading 为 `PixelCat`
- 大面积移除说明卡、概览卡、容器卡上的白底和超大圆角
- 删除壳层右上角卡片

优点：

1. 能明显提升“简洁感”，同时不改行为逻辑。
2. 改动边界清晰，适合当前仓库状态。
3. 可以按页面和组件做小范围可 review 的 diff。

**方案 C：借机做整站重排**

- 除去白卡外，还重做收藏页、设置页、认证页的结构与交互布局

问题：

1. 已经超出“调整现在的 UI”的范围。
2. diff 会明显扩大，回归风险升高。

### 3.2 最终选择

采用 **方案 B：结构不变，视觉整体瘦身**。

原因：

1. 与用户要求完全对齐。
2. 可以在不动业务逻辑的前提下显著改变页面观感。
3. 适合当前已有测试和组件结构，回归风险可控。

---

## 4. 全局设计规则

### 4.1 Loading 统一规则

所有等待态统一收敛到 `PixelCat`，不再出现以下表达：

1. 灰色圆形 pulse 占位
2. 骨架块模拟卡片
3. 仅一行纯文本等待但无视觉锚点

统一保留三种 loading 形态：

1. **页面级 loading**
   - 结构：`PixelCat + 简短文案`
   - 用于首页首屏、收藏页登录检查、设置页登录检查、认证页恢复链接检查等
   - 不套白色大卡片

2. **区块级 loading**
   - 结构：`PixelCat + 小字文案`
   - 用于分类结果区、局部查询区、面板内部等待态
   - 保持最小承载，不使用骨架卡片列表

3. **按钮级提交态 loading**
   - 结构：按钮内联 `PixelCat + 提交文案`
   - 用于登录、注册、发送重置邮件、更新密码、提交感悟等明确的提交动作
   - 不额外生成独立 loading 容器，按钮尺寸和点击边界保持稳定

为了减少重复，建议由 `src/components/common/LoadingScreen.tsx` 作为统一基础组件，支持：

1. `label`
2. `compact` 或等价的尺寸控制
3. 无需白色背景容器的默认样式
4. 支持路由级 `Suspense` 和页面局部状态复用
5. 为持续动画提供减弱动画的实现入口，例如基于 `prefers-reduced-motion` 降低或停止运动幅度

### 4.2 白底圆角使用规则

保留白底和明显圆角的场景：

1. 首页主句卡
2. 抽屉、面板类浮层
3. 输入框、主按钮等必须具备点击边界的控件
4. 少数确实需要内容承载感的局部容器

应去掉或明显减轻的场景：

1. 页面说明卡
2. 概览卡
3. 入口卡
4. 外层结果容器卡
5. 登录前引导卡
6. 设置页的分组外层大卡

替代表达方式：

1. 纯排版分段
2. 细边线分隔
3. 极浅底色块
4. 更小圆角而非超大圆角
5. 降低阴影使用频率

### 4.3 顶栏规则

`AppShell` 顶栏只保留：

1. 应用标题
2. 副标题

删除右上角“慢慢读”卡片后，不再补新的装饰卡或状态卡，保持顶部信息单一明确。

### 4.4 控件圆角规则

按钮、输入框、筛选 chip 仍保留圆角，但统一收小，不再使用页面级 `rounded-[2rem]` 那种强烈卡片语言。

原则：

1. 容器更平
2. 控件更清楚
3. 页面层级靠排版，而不是一层层白卡

---

## 5. 页面级设计

### 5.1 应用壳层

文件：

1. `src/app/layout/AppShell.tsx`

调整：

1. 删除右上角 `PixelCat + Slow Read / 慢慢读` 卡片。
2. header 保留标题和副标题。
3. 不新增替代卡片。

预期结果：

1. 所有页面顶部更干净。
2. 首屏注意力回到页面内容本身。

### 5.2 首页

文件：

1. `src/pages/home/HomePage.tsx`

调整：

1. 首屏 loading 从当前大圆角渐变容器改为 `PixelCat + 文案`。
2. 下拉刷新提示保留；仅在 `refreshing = true` 时，把现有顶部提示条内部内容替换为 `PixelCat + 文案`。`下拉换一组 / 松手刷新` 两个非刷新态继续保留原文本提示，不覆盖 quote stream，也不新增独立刷新遮罩。
3. 登录提示与错误提示保留当前浮层位置，但视觉做轻量收敛，避免像漂浮卡片。

不做的事：

1. 不重做首页主句卡结构。
2. 不改横向切换逻辑。
3. 不改操作栏业务行为。

### 5.3 分类页

文件：

1. `src/pages/categories/components/CategoryFilters.tsx`
2. `src/pages/categories/components/CategoryQuoteGrid.tsx`
3. `src/pages/categories/CategoriesPage.tsx`

调整：

1. 搜索区去掉大白底大圆角卡，改为更轻的标题段落加输入区。
2. 分类、作者、歌手三个分区去掉卡片外壳，改为分段布局。
3. 结果区外层去掉白色大卡。
4. 结果项本身保留轻承载，但从“厚卡”改为“浅底列表块”。
5. 当前骨架 loading 改为 `PixelCat`。
6. 搜索触发的人物加载若保留区块等待态，也使用统一的紧凑 loading 表达。

预期结果：

1. 用户进入分类页后直接看到筛选入口，而不是被多层卡片包围。
2. 页面信息密度更高，但不凌乱。

### 5.4 收藏页

文件：

1. `src/pages/favorites/FavoritesPage.tsx`

调整：

1. 页首说明区不再使用大白卡。
2. “收藏夹概览”区不再放在厚重容器里，`StarBottle` 仍保留。
3. “我的收藏”外层容器去卡片化。
4. 收藏项保留轻量承载，优先使用浅底和边线，而非阴影大卡。
5. 登录前入口区同样去白卡，只保留必要按钮和文案层级。
6. 登录状态检查 loading 改为 `PixelCat`。

### 5.5 设置页

文件：

1. `src/pages/settings/SettingsPage.tsx`

调整：

1. 页首说明卡移除。
2. “账号”“主题偏好”“未登录入口”从大白卡改成设置分组式布局。
3. 头像、退出登录、主题按钮保留交互边界，但容器减重。
4. 登录状态检查 loading 改为 `PixelCat`。
5. 若 `profile` 局部仍在加载，局部等待态也应使用 `PixelCat`，而不是纯文本。

### 5.6 认证页

文件：

1. `src/pages/auth/AuthLayout.tsx`
2. `src/pages/auth/LoginPage.tsx`
3. `src/pages/auth/RegisterPage.tsx`
4. `src/pages/auth/ForgotPasswordPage.tsx`
5. `src/pages/auth/ResetPasswordPage.tsx`

调整：

1. `AuthLayout` 去掉大白色面板，改成直接承载标题、说明和表单。
2. 表单字段仍保留必要输入边界，但圆角缩小，背景更克制。
3. 提交按钮保留主按钮形态，但不再依赖页面整体白卡承托。
4. 登录、注册、发送重置邮件、更新密码等提交态统一改为按钮内联 `PixelCat + 文案`。
5. `ResetPasswordPage` 中“正在验证重置链接”改成 `PixelCat` 等待态。
6. 忘记密码、登录、注册、重置密码四页保持统一简洁风格。

---

## 6. 组件职责调整

### 6.1 `src/components/common/LoadingScreen.tsx`

职责调整为：

1. 成为全站统一 loading 组件。
2. 内部使用 `PixelCat`。
3. 同时支持页面级和紧凑级 loading 表达。
4. 默认不带白色大卡背景。

### 6.2 `src/components/PixelCat.tsx`

原则上不改变动画语义，只作为 loading 主体复用。  
如需支持不同上下文尺寸，可仅通过 props 调整大小和颜色，不增加复杂状态。  
若 reduced-motion 入口最终落在该组件，也属于本次改动范围。

### 6.3 页面内联 loading

凡是页面里写死的“正在确认登录状态...”“正在验证重置链接...”或骨架块占位，都应改为调用统一 loading 组件，而不是继续各写各的。

### 6.4 抽屉与面板内部 loading

本次将抽屉和面板内部的等待态一并纳入统一 loading 规则，但范围仅限等待态本身，不涉及抽屉整体结构调整。

明确包含：

1. `src/components/reflection/ReflectionPanel.tsx` 中的感悟列表加载态
2. `src/components/reflection/ReflectionPanel.tsx` 中“提交感悟”按钮的内联 loading 表达
3. `src/pages/home/HomePage.tsx` 中感悟提交状态传递到 `ReflectionPanel` 的最小状态改动

明确不包含：

1. 抽屉圆角、尺寸、动效、布局结构的大改
2. 样式编辑抽屉的视觉重做

---

## 7. 测试策略

本次改版不改变业务逻辑，但会影响渲染结构和文案定位，因此需要最小覆盖：

1. 页面仍能正常渲染核心标题与入口。
2. loading 态仍有可断言文本。
3. 认证页、收藏页、设置页在 loading 和未登录分支下依旧可进入目标流程。
4. 分类页 loading 改造后，结果区测试仍能稳定断言。
5. 首页需要新增首屏 loading UI 断言，以及下拉刷新提示条在刷新中显示 `PixelCat + 文案` 的断言。
6. 路由级 `Suspense fallback` 仍能显示统一 loading。
7. `PixelCat` 作为全站 loading 时，至少保留稳定的可断言文本与 `aria-label` 或等价状态语义。
8. 对持续动画实现需要验证 reduced-motion 分支不会破坏渲染和测试。

需要新增或更新的最小测试：

1. `src/pages/home/HomePage.test.tsx`
   - 新增首页首屏 loading 断言
   - 新增下拉刷新提示条在 `refreshing = true` 时显示 `PixelCat + 文案` 的断言
2. `src/components/reflection/ReflectionPanel.test.tsx` 或等价测试文件
   - 新增感悟列表 loading 使用统一 `PixelCat` 的断言
   - 新增“提交感悟”按钮内联 loading 的断言
3. `src/pages/favorites/FavoritesPage.test.tsx`
   - 新增 `authState.loading = true` 分支断言
   - 显式断言该分支使用统一 loading 语义，而不是纯文本或旧骨架
4. `src/pages/settings/SettingsPage.test.tsx`
   - 新增 `authState.loading = true` 分支断言
   - 新增 `profile` 局部 loading 使用 `PixelCat` 的断言
   - 显式断言页面和局部 loading 均使用统一 loading 语义
5. `src/pages/categories/CategoriesPage.test.tsx`
   - 更新结果区 loading 断言，去除对骨架块的假设
   - 显式断言结果区 loading 使用统一 loading 语义
6. `src/pages/auth/AuthPages.test.tsx`
   - 新增认证提交态按钮 loading 断言
   - 新增 `ResetPasswordPage` 链接检查 loading 断言
7. `src/app/router.test.tsx`
   - 新增或更新路由级 `Suspense fallback` loading 断言
8. `src/app/layout/AppShell.test.tsx` 或等价测试文件
   - 新增右上角“慢慢读”卡片已移除的断言
9. `src/components/common/LoadingScreen.test.tsx` 或等价测试文件
   - 新增统一 loading 的 `aria-label` 或等价状态语义断言
10. `src/components/PixelCat.test.tsx` 或等价测试文件
   - 新增 `PixelCat` props 行为断言
11. `src/components/common/LoadingScreen.test.tsx` 或等价测试文件
   - 若 reduced-motion 入口落在 `LoadingScreen`，在此新增对应断言；若入口落在 `PixelCat`，则在 `src/components/PixelCat.test.tsx` 中新增对应断言

验证顺序：

1. 先跑相关 `vitest` 页面测试
2. 再决定是否补充全量测试

---

## 8. 风险与约束

1. 去掉大白卡后，局部可读性可能下降，因此需要保留“浅底 + 细边线”的最低承载，而不是机械地全部抹平。
2. 页面结构类名会调整，现有测试若依赖具体 DOM 层级，需要同步修正。
3. 认证页去掉外层白色面板后，表单与背景的对比度必须保持可读。
4. 首页提示和刷新区减重时，不能影响触达和状态识别；刷新时不能遮挡当前句流内容。
5. `PixelCat` 升格为统一 loading 后，需要保证路由级、页面级、按钮级三类场景都具备可访问的状态语义。
6. 当前仓库工作树已有其他未提交改动，实现时必须只改这次 UI 相关文件，不回退他人修改。

---

## 9. 实施边界

预计主要涉及以下文件：

1. `src/app/layout/AppShell.tsx`
2. `src/components/common/LoadingScreen.tsx`
3. `src/components/PixelCat.tsx`
4. `src/components/reflection/ReflectionPanel.tsx`
5. `src/app/router.tsx`
6. `src/pages/home/HomePage.tsx`
7. `src/pages/categories/components/CategoryFilters.tsx`
8. `src/pages/categories/components/CategoryQuoteGrid.tsx`
9. `src/pages/favorites/FavoritesPage.tsx`
10. `src/pages/settings/SettingsPage.tsx`
11. `src/pages/auth/AuthLayout.tsx`
12. `src/pages/auth/LoginPage.tsx`
13. `src/pages/auth/RegisterPage.tsx`
14. `src/pages/auth/ForgotPasswordPage.tsx`
15. `src/pages/auth/ResetPasswordPage.tsx`
16. 对应测试文件

原则：

1. 保持小 diff。
2. 不改 API 和路由。
3. 不引入新的设计系统依赖。
4. 不顺手做无关重构。

---

## 10. 结论

本次 UI 改版将采用“结构不变、视觉整体瘦身”的路线：

1. 全站 loading 统一使用 `PixelCat`。
2. 非必要区域移除白底大圆角大阴影卡片。
3. 删除所有 `AppShell` 内页面右上角的“慢慢读”卡片入口。
4. 收藏、设置、分类、认证页统一回到更直接的排版式界面。

这样可以在不动核心功能的前提下，把当前应用从“卡片堆叠式界面”收敛成更轻、更直接、更适合阅读内容的移动端 UI。

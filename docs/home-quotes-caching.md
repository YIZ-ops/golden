# 首页金句流缓存方案

## 目标

在不改变“每次请求随机取 5 条金句”语义的前提下，优化首页首屏体验：

- 用户返回首页时，优先展示最近一次可用数据，减少白屏等待
- 后台继续拉取最新随机数据，完成后静默更新

## 当前实现（2026-03-23）

实现位置：

- [src/pages/home/HomePage.tsx](src/pages/home/HomePage.tsx)

关键点：

1. **缓存介质**：`sessionStorage`
2. **缓存 Key**：`golden-home-quotes-cache`
3. **TTL**：30 秒（`HOME_QUOTES_CACHE_TTL_MS = 30_000`）
4. **用户隔离**：缓存数据绑定 `userId`（匿名用户记为 `null`）
5. **策略**：SWR 风格（Stale-While-Revalidate）
   - 先读缓存并渲染（若命中）
   - 再请求 `/api/home/quotes` 拉最新随机数据
   - 请求成功后覆盖 UI 与缓存
6. **测试隔离**：在 `import.meta.env.MODE === "test"` 时禁用缓存，避免测试用例互相污染

## 与随机逻辑的关系

首页仍然通过后端 RPC `random_home_quotes` 取随机数据，缓存仅用于“短时复用最近一次结果”，不会改变服务端随机函数。

相关文件：

- [api/home/quotes.ts](api/home/quotes.ts)
- [supabase/migrations/20260322_optimize_home_quote_randomness.sql](supabase/migrations/20260322_optimize_home_quote_randomness.sql)

## 已知边界

- 缓存为会话级：关闭标签页后清空
- 目前只缓存“首页主批次金句”，不对收藏、感悟等行为做额外缓存
- 路由传入 `focusQuote` 时，仍优先展示焦点金句，并对随机批次去重

## 后续可选优化

1. 动态 TTL（弱网场景适当延长）
2. 增加“缓存命中埋点”用于评估实际收益
3. 针对登录态增加更细粒度缓存分片（例如按 token 指纹）

# 收藏夹缓存实现

## 概述

为了优化性能，减少不必要的 API 请求，实现了收藏夹数据的客户端缓存机制。

## 缓存策略

### 缓存时长

- **5 分钟** (300,000 毫秒)：缓存有效期内不会重新请求数据

### 何时更新缓存

缓存只在以下操作后主动刷新：

1. **创建新收藏夹** (`handleCreateFolder`)
2. **添加句子到收藏夹** (`handleManualQuoteSubmit`)

### 何时不更新缓存

- 用户进入收藏夹页面（使用缓存）
- 页面重新渲染
- 导航回到收藏夹页面（只要缓存未过期）

## 实现细节

### `useFavoriteFoldersCache` Hook

位置：[src/hooks/useFavoriteFoldersCache.ts](src/hooks/useFavoriteFoldersCache.ts)

**功能：**

- 管理收藏夹数据的缓存状态
- 追踪缓存的有效性和时间戳
- 提供手动刷新机制

**API：**

```typescript
const { folders, loading, error, refresh } = useFavoriteFoldersCache(userId);

// folders: FavoriteFolder[] - 缓存的收藏夹列表
// loading: boolean - 是否正在加载中
// error: string | null - 缓存错误信息
// refresh: () => Promise<void> - 强制刷新缓存
```

**内部逻辑：**

1. 初始化时（`userId` 改变）：发起请求
2. 首次加载后：缓存数据和时间戳
3. 后续调用：检查缓存是否有效
   - 有效：直接返回缓存数据
   - 过期：重新请求

### FavoritesPage 集成

位置：[src/pages/favorites/FavoritesPage.tsx](src/pages/favorites/FavoritesPage.tsx)

**变化：**

- 移除 `loadFolders` 回调和 `useEffect`
- 使用 `useFavoriteFoldersCache` hook 替代
- 调用 `refreshFolders()` 而不是 `loadFolders()` 来更新

```tsx
const { folders, loading: loadingFolders, error: cacheError, refresh: refreshFolders } = useFavoriteFoldersCache(user?.id);

// 创建收藏夹后刷新
await refreshFolders();

// 添加句子后刷新
await favoriteQuote(created.quote.id, folderId);
await refreshFolders();
```

## 测试覆盖

位置：[src/hooks/useFavoriteFoldersCache.test.ts](src/hooks/useFavoriteFoldersCache.test.ts)

**测试场景：**

1. ✓ 缓存在 5 分钟内不会重新请求
2. ✓ 调用 `refresh()` 时强制更新数据
3. ✓ 用户未登录时返回空列表

## 性能优势

### 改进前

- 每次进入收藏夹页面：1 次 API 请求
- 页面重新渲染：可能多次请求

### 改进后

- 5 分钟内：仅 1 次 API 请求
- 主动操作后：按需 1 次请求
- 其他情况：0 次请求

### 预期节省

对于活跃用户（5 分钟内访问 5 次页面）：

- **改进前**：5 次请求
- **改进后**：1 次请求 + 0-1 次主动刷新 = 最多 2 次请求
- **节省**：60% 以上的 API 调用

## 缓存清理

- **自动过期**：超过 5 分钟后自动过期
- **用户退出登录**：自动清空缓存
- **手动刷新**：调用 `refresh()` 立即更新

## 未来改进

1. 可以添加操作性缓存失效（例如删除收藏夹时直接更新缓存而不是重新请求）
2. 可以添加缓存预热机制（后台定期刷新）
3. 可以使用 IndexedDB 实现持久化缓存

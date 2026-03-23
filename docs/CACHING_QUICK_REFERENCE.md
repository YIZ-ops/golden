## 收藏夹缓存快速参考

### 🎯 核心概念

- **缓存时长**：5 分钟
- **自动行为**：在有效期内使用缓存，不发起新请求
- **主动刷新**：在创建/修改/删除操作后手动刷新

### 📊 请求流程

```
用户访问收藏夹页面
    ↓
检查缓存是否有效？
    ├─ 是 → 直接使用缓存数据 (0 次请求)
    └─ 否 → 发起 API 请求 (1 次请求)

用户执行操作（创建/添加/删除）
    ↓
调用 refreshFolders()
    ↓
强制刷新缓存 (1 次请求)
    ↓
返回新数据
```

### 💡 使用示例

**在组件中使用缓存 hook：**

```tsx
import { useFavoriteFoldersCache } from "@/hooks/useFavoriteFoldersCache";

function MyComponent() {
  const { folders, loading, error, refresh } = useFavoriteFoldersCache(userId);

  // 使用 folders 数据
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  // 执行操作后手动刷新
  async function handleCreate() {
    await createFolder(...);
    await refresh(); // 立即更新缓存
  }

  return <div>{/* 显示 folders */}</div>;
}
```

### 📈 性能指标

| 场景               | 改进前         | 改进后    | 节省     |
| ------------------ | -------------- | --------- | -------- |
| 5分钟内访问5次页面 | 5次请求        | 1-2次请求 | 60-80%   |
| 页面重新渲染       | 可能多次请求   | 0次请求   | 100%     |
| 创建后立即查看     | 手动刷新后请求 | 自动请求  | 智能更新 |

### ⚙️ 配置参数

缓存时长配置位置：`src/hooks/useFavoriteFoldersCache.ts`

```typescript
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
```

需要调整缓存时长时，修改这个常量。

### 🔍 调试技巧

1. **查看缓存是否工作**
   - 打开浏览器开发者工具 → Network
   - 进入收藏夹页面（第一次会有请求）
   - 离开再进入（如果在5分钟内，不会有新请求）

2. **清除缓存**
   - 刷新页面 → 重新登录
   - 或修改 userId（自动清空旧用户缓存）

3. **强制刷新**
   - 调用 `refresh()` 方法立即更新

### ✅ 已知限制

1. 缓存为内存缓存，刷新页面会清空
2. 多标签页面间没有缓存同步
3. 离线时无法访问缓存数据

### 📋 待办项（Future Enhancements）

- [ ] 实现 IndexedDB 持久化缓存
- [ ] 添加缓存预热机制
- [ ] 优化型缓存失效（局部更新）
- [ ] 跨标签页缓存同步

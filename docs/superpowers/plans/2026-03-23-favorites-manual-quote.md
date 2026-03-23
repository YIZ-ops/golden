# Favorites Manual Quote Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在收藏夹页右下角增加“写”图标入口，允许用户手动录入句子并保存到指定收藏夹。

**Architecture:** 沿用现有 “前端页面 + `/api/*` BFF + Supabase” 边界。后端新增 `POST /api/quotes` 创建 `manual` 类型 quote，前端在收藏夹页通过底部抽屉收集表单，先创建 quote，再复用现有 `/api/favorites` 接口完成收藏。

**Tech Stack:** React 19, React Router, TypeScript, Vitest, Testing Library, Vercel Functions, Supabase

---

## Chunk 1: Manual Quote API

### Task 1: 为 `POST /api/quotes` 写失败测试

**Files:**
- Create: `api/quotes/index.test.ts`
- Modify: `api/quotes/index.ts`
- Test: `api/quotes/index.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("creates a manual quote for an authenticated user", async () => {
  // request body includes content/author/source/category
  // expect insert payload to use source_type: "manual"
});

it("rejects missing content or author", async () => {
  // expect 400 INVALID_QUOTE_CREATE
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- api/quotes/index.test.ts`
Expected: FAIL because `POST /api/quotes` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export async function POST(request: Request) {
  // authenticate user
  // validate trimmed content/author
  // insert into quotes with source_type: "manual"
  // return normalized quote
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- api/quotes/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/quotes/index.ts api/quotes/index.test.ts
git commit -m "feat: add manual quote creation api"
```

### Task 2: 补齐 quote client 的创建方法

**Files:**
- Modify: `src/services/api/quotes.ts`
- Test: `src/services/api/quotes.ts` via page tests in later tasks

- [ ] **Step 1: Write the failing test indirectly in the page test first**

The page test must expect:

```ts
expect(createQuote).toHaveBeenCalledWith({
  content: "自定义句子",
  author: "作者甲",
  source: "来源甲",
  category: "分类甲",
});
```

- [ ] **Step 2: Add minimal client method after the page test fails**

```ts
export async function createQuote(input: {
  content: string;
  author: string;
  source?: string;
  category?: string;
}) {
  return apiRequest<{ quote: Quote }>("/api/quotes", {
    method: "POST",
    body: input,
  });
}
```

- [ ] **Step 3: Verify with the page test**

Run: `npm test -- src/pages/favorites/FavoritesPage.test.tsx`
Expected: page test moves from “missing API call” to the next failure.

- [ ] **Step 4: Commit**

```bash
git add src/services/api/quotes.ts
git commit -m "feat: add manual quote client"
```

## Chunk 2: Favorites Page Entry and Drawer

### Task 3: 为收藏页的“写”入口和抽屉交互写失败测试

**Files:**
- Create: `src/pages/favorites/FavoritesPage.test.tsx`
- Modify: `src/pages/favorites/FavoritesPage.tsx`
- Optional Create: `src/pages/favorites/components/ManualQuoteDrawer.tsx`
- Test: `src/pages/favorites/FavoritesPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("renders a floating write button and opens the manual quote drawer", async () => {
  // expect floating button
  // click it
  // expect heading "添加句子"
});

it("closes the drawer when clicking the backdrop", async () => {
  // open drawer
  // click backdrop
  // expect drawer closed
});

it("blocks submit when required fields are empty", async () => {
  // click save with empty fields
  // expect validation message
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/favorites/FavoritesPage.test.tsx`
Expected: FAIL because the floating action and drawer do not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
// add floating write button
// add local open state
// render bottom drawer with content/author/source/category/folder fields
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/favorites/FavoritesPage.test.tsx`
Expected: drawer open/close and empty-form validation tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/favorites/FavoritesPage.tsx src/pages/favorites/FavoritesPage.test.tsx
git commit -m "feat: add manual quote drawer entry"
```

### Task 4: 为“先创建 quote，再加入收藏夹”写失败测试并实现

**Files:**
- Modify: `src/pages/favorites/FavoritesPage.tsx`
- Modify: `src/pages/favorites/FavoritesPage.test.tsx`
- Optional Create: `src/pages/favorites/components/ManualQuoteDrawer.tsx`
- Modify: `src/services/api/quotes.ts`
- Modify: `src/services/api/favorites.ts`

- [ ] **Step 1: Write the failing test**

```tsx
it("creates a manual quote and then favorites it into the selected folder", async () => {
  // fill content/author/source/category/folder
  // submit
  // expect createQuote called first
  // expect favoriteQuote called with created id + folder id
  // expect folders reload and drawer close
});

it("shows an error when quote creation fails and does not favorite", async () => {
  // createQuote rejects
  // expect favoriteQuote not called
});

it("shows an error when favoriting fails", async () => {
  // createQuote resolves, favoriteQuote rejects
  // expect drawer stays open with error
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/favorites/FavoritesPage.test.tsx`
Expected: FAIL because submit flow is not implemented yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
async function handleSubmitManualQuote() {
  const created = await createQuote({
    content,
    author,
    source,
    category,
  });
  await favoriteQuote(created.quote.id, selectedFolderId);
  await loadFolders();
  closeDrawer();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/favorites/FavoritesPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/favorites/FavoritesPage.tsx src/pages/favorites/FavoritesPage.test.tsx src/services/api/quotes.ts
git commit -m "feat: save manual quotes into favorite folders"
```

## Chunk 3: Final Verification

### Task 5: 运行相关回归

**Files:**
- Modify: `api/quotes/index.ts`
- Modify: `src/services/api/quotes.ts`
- Modify: `src/pages/favorites/FavoritesPage.tsx`
- Test: `api/quotes/index.test.ts`
- Test: `src/pages/favorites/FavoritesPage.test.tsx`

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- api/quotes/index.test.ts src/pages/favorites/FavoritesPage.test.tsx src/services/api/favorites.test.ts`
Expected: PASS

- [ ] **Step 2: Run broader navigation regression**

Run: `npm test -- src/app/layout/AppShell.test.tsx src/app/router.test.tsx`
Expected: PASS

- [ ] **Step 3: Run type check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/quotes/index.ts api/quotes/index.test.ts src/services/api/quotes.ts src/pages/favorites/FavoritesPage.tsx src/pages/favorites/FavoritesPage.test.tsx
git commit -m "feat: add manual quote creation from favorites"
```

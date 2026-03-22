# Homepage Hitokoto Stream Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把首页改成无顶部区的全屏一言句流，删除“下一句”按钮，改为滚动自动补句，并把操作区弱化成卡内悬浮图标栏。

**Architecture:** 保留现有首页的纵向吸附滚动骨架，但把首页首屏数据切到 `fetchHitokoto`，并在首页内部增加自动预取与轻量去重逻辑。UI 方面只改首页、句子卡和操作栏，确保收藏、心动、感悟、样式和导出能力继续工作，同时通过测试先锁定新行为再做最小实现。

**Tech Stack:** React 19, TypeScript, React Router, Vitest, React Testing Library, lucide-react, Vite

---

**Execution Notes**

- 当前仓库已有未提交改动，执行时只能暂存本计划涉及文件，不能回退其他工作区修改。
- 首页改版优先复用已有 `fetchHitokoto` 前后端链路，不新增新的首页 API。
- 测试命令优先跑单文件：`npx vitest run src/pages/home/HomePage.test.tsx`，确认首页行为稳定后再跑类型检查。
- 首页不再使用 `getQuotes` 作为首屏数据源，但不要影响分类页等仍依赖 `getQuotes` 的现有行为。

## Chunk 1: Home Page Data Flow

### Task 1: Rewrite the home page tests around Hitokoto-first loading

**Files:**
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`

- [ ] **Step 1: Write the failing tests for the new homepage loading contract**

Update `HomePage.test.tsx` so that:

```ts
it('loads the first quote from hitokoto and does not call getQuotes', async () => {
  renderPage();

  expect(await screen.findByText('第三句，写给海面。')).toBeInTheDocument();
  expect(quotesApi.fetchHitokoto).toHaveBeenCalledTimes(1);
  expect(quotesApi.getQuotes).not.toHaveBeenCalled();
});
```

Add a second test to verify the explicit “获取下一句” button no longer exists:

```ts
it('does not render a next-quote button', async () => {
  renderPage();

  await screen.findByText('第三句，写给海面。');
  expect(screen.queryByRole('button', { name: '获取下一句' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the homepage test file to verify the new tests fail for the expected reason**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: FAIL because `HomePage` still calls `getQuotes` and still renders the next-quote action.

- [ ] **Step 3: Implement the minimal homepage data-source switch**

Modify `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx` to:

```ts
useEffect(() => {
  let active = true;
  setLoading(true);
  setError(null);

  fetchHitokoto()
    .then((response) => {
      if (!active) return;
      setQuotes([
        {
          ...response.quote,
          viewerState: {
            isFavorited: false,
            viewerHeartbeatCount: 0,
          },
        },
      ]);
      setCurrentIndex(0);
    })
    .catch(() => {
      if (active) setError('首页金句加载失败，请稍后重试。');
    })
    .finally(() => {
      if (active) setLoading(false);
    });

  return () => {
    active = false;
  };
}, []);
```

Also remove the now-unused `getQuotes` import and next-quote button wiring.

- [ ] **Step 4: Run the homepage test file to verify the new tests pass**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: PASS for the new loading tests, with other homepage tests likely still failing until later tasks land.

- [ ] **Step 5: Commit the data-source switch**

```bash
git add src/pages/home/HomePage.tsx src/pages/home/HomePage.test.tsx
git commit -m "feat: load homepage from hitokoto"
```

### Task 2: Add auto-prefetch and lightweight deduping near the end of the stream

**Files:**
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`

- [ ] **Step 1: Write the failing auto-prefetch tests**

Add a test that simulates scrolling onto the last loaded card and expects automatic append:

```ts
it('prefetches another hitokoto when the reader reaches the end of the stream', async () => {
  quotesApi.fetchHitokoto
    .mockResolvedValueOnce({ quote: firstQuote })
    .mockResolvedValueOnce({ quote: secondQuote });

  renderPage();
  await screen.findByText(firstQuote.content);

  const stream = screen.getByTestId('quote-stream');
  Object.defineProperty(stream, 'clientHeight', { configurable: true, value: 600 });
  Object.defineProperty(stream, 'scrollTop', { configurable: true, value: 600 });

  fireEvent.scroll(stream);

  await screen.findByText(secondQuote.content);
  expect(quotesApi.fetchHitokoto).toHaveBeenCalledTimes(2);
});
```

Add a second test for duplicate suppression:

```ts
it('retries hitokoto fetch when the appended quote already exists in the stream', async () => {
  quotesApi.fetchHitokoto
    .mockResolvedValueOnce({ quote: firstQuote })
    .mockResolvedValueOnce({ quote: firstQuote })
    .mockResolvedValueOnce({ quote: secondQuote });

  renderPage();
  await screen.findByText(firstQuote.content);

  const stream = screen.getByTestId('quote-stream');
  Object.defineProperty(stream, 'clientHeight', { configurable: true, value: 600 });
  Object.defineProperty(stream, 'scrollTop', { configurable: true, value: 600 });

  fireEvent.scroll(stream);

  await screen.findByText(secondQuote.content);
  expect(quotesApi.fetchHitokoto).toHaveBeenCalledTimes(3);
});
```

- [ ] **Step 2: Run the homepage test file to verify auto-prefetch tests fail**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: FAIL because scroll currently only updates `currentIndex` and never auto-fetches or dedupes.

- [ ] **Step 3: Implement minimal prefetch and dedupe logic**

In `HomePage.tsx`, add:

```ts
const MAX_APPEND_RETRIES = 3;

async function appendNextQuoteWithDedup(retries = 0): Promise<void> {
  const response = await fetchHitokoto();
  const nextQuote: HomeQuote = {
    ...response.quote,
    viewerState: {
      isFavorited: false,
      viewerHeartbeatCount: 0,
    },
  };

  const duplicate = quotesRef.current.some((item) => item.id === nextQuote.id);
  if (duplicate && retries < MAX_APPEND_RETRIES) {
    return appendNextQuoteWithDedup(retries + 1);
  }

  if (!duplicate) {
    setQuotes((current) => [...current, nextQuote]);
  }
}
```

Use refs or safe state callbacks so the dedupe check sees the latest `quotes`, and trigger `appendNextQuoteWithDedup()` when `handleScroll` moves onto the last loaded item (or within one item of the end) and `loadingNext` is false.

- [ ] **Step 4: Run the homepage test file to verify auto-prefetch passes**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: PASS for the new prefetch/dedupe tests.

- [ ] **Step 5: Commit the auto-prefetch behavior**

```bash
git add src/pages/home/HomePage.tsx src/pages/home/HomePage.test.tsx
git commit -m "feat: auto-prefetch hitokoto on home stream"
```

### Task 3: Preserve the reading flow when append requests fail

**Files:**
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx`

- [ ] **Step 1: Write the failing error-handling test**

Add:

```ts
it('keeps the current stream readable when prefetch fails', async () => {
  quotesApi.fetchHitokoto
    .mockResolvedValueOnce({ quote: firstQuote })
    .mockRejectedValueOnce(new Error('服务异常'));

  renderPage();
  await screen.findByText(firstQuote.content);

  const stream = screen.getByTestId('quote-stream');
  Object.defineProperty(stream, 'clientHeight', { configurable: true, value: 600 });
  Object.defineProperty(stream, 'scrollTop', { configurable: true, value: 600 });

  fireEvent.scroll(stream);

  expect(await screen.findByText(firstQuote.content)).toBeInTheDocument();
  expect(await screen.findByText('下一句获取失败，请稍后重试。')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the homepage test file to verify the error test fails**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: FAIL because append errors are not yet surfaced in the new auto-prefetch flow.

- [ ] **Step 3: Implement the minimal resilient error state**

Update the append path in `HomePage.tsx` so that:

```ts
setLoadingNext(true);
setError(null);

try {
  await appendNextQuoteWithDedup();
} catch {
  setError('下一句获取失败，请稍后重试。');
} finally {
  setLoadingNext(false);
}
```

Do not clear `quotes` or reset `currentIndex` when append fails.

- [ ] **Step 4: Run the homepage test file to verify the error case passes**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: PASS for the new failure-handling test, with the existing stream still rendered.

- [ ] **Step 5: Commit the resilient append behavior**

```bash
git add src/pages/home/HomePage.tsx src/pages/home/HomePage.test.tsx
git commit -m "fix: keep home stream stable on append errors"
```

## Chunk 2: Full-Screen Card UI

### Task 4: Update the quote card layout for full-screen reading

**Files:**
- Modify: `C:\Users\14798\Desktop\金\src\components\quote\QuoteCard.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`

- [ ] **Step 1: Write the failing layout-oriented homepage test**

Add a structural assertion:

```ts
it('renders the home page without the hero header and keeps a full-screen quote stream', async () => {
  renderPage();

  await screen.findByText(firstQuote.content);
  expect(screen.queryByRole('heading', { name: '首页' })).not.toBeInTheDocument();
  expect(screen.getByTestId('quote-stream')).toHaveClass('snap-y');
});
```

If `HomeHero` does not expose a stable heading query in the current tree, replace the assertion with an explicit check for the removed helper copy.

- [ ] **Step 2: Run the homepage test file to verify the UI test fails**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: FAIL because the hero section is still rendered.

- [ ] **Step 3: Implement the minimal full-screen card structure**

Modify `HomePage.tsx` to remove `HomeHero`, remove `titleCopy`, and render only:

```tsx
<section className="relative">
  {error ? <InlineNotice message={error} /> : null}
  {loginPrompt ? <InlineNotice message={loginPrompt} actionLabel="去登录" to="/auth/login" /> : null}
  <div
    ref={streamRef}
    className="h-[calc(100vh-11rem)] snap-y snap-mandatory overflow-y-auto"
    data-testid="quote-stream"
    onScroll={handleScroll}
  >
    {quotes.map(...)}
  </div>
</section>
```

Update `QuoteCard.tsx` to give the article/card a near-full-screen height and extra bottom padding for the floating toolbar safe area.

- [ ] **Step 4: Run the homepage test file to verify the UI structure passes**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: PASS for the hero-removal/full-screen stream test.

- [ ] **Step 5: Commit the full-screen card layout**

```bash
git add src/pages/home/HomePage.tsx src/components/quote/QuoteCard.tsx src/pages/home/HomePage.test.tsx
git commit -m "feat: make homepage a full-screen quote stream"
```

### Task 5: Convert the action bar into a lightweight floating icon rail

**Files:**
- Modify: `C:\Users\14798\Desktop\金\src\components\quote\QuoteActions.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`

- [ ] **Step 1: Write the failing action-bar test**

Add a test that verifies the next-quote control is gone while the five remaining actions still exist by `aria-label`:

```ts
it('renders a five-action floating toolbar without text labels', async () => {
  renderPage();

  await screen.findByText(firstQuote.content);
  expect(screen.getByRole('button', { name: '心动当前金句' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '收藏当前金句' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '打开感悟面板' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '打开样式面板' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '导出当前金句' })).toBeInTheDocument();
  expect(screen.queryByText('收藏')).not.toBeInTheDocument();
  expect(screen.queryByText('心动')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the homepage test file to verify the action-bar test fails**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: FAIL because `QuoteActions` still renders text labels and the removed next-quote button.

- [ ] **Step 3: Implement the minimal floating icon toolbar**

In `QuoteActions.tsx`:

```tsx
<div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
  <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-stone-200/60 bg-white/45 px-2 py-1.5 backdrop-blur-xl">
    <ActionButton ariaLabel="心动当前金句" icon={<Heart size={16} />} />
    <ActionButton ariaLabel="收藏当前金句" icon={<Star size={16} />} />
    <ActionButton ariaLabel="打开感悟面板" icon={<MessageSquare size={16} />} />
    <ActionButton ariaLabel="打开样式面板" icon={<Palette size={16} />} />
    <ActionButton ariaLabel="导出当前金句" icon={<Download size={16} />} />
  </div>
</div>
```

Update the button component so it renders icons only, keeps a 40px+ tap target, and expresses active state through subtle color changes rather than large filled tiles.

- [ ] **Step 4: Run the homepage test file to verify the toolbar test passes**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: PASS for the floating toolbar test, with the existing interaction tests still green.

- [ ] **Step 5: Commit the icon-only toolbar**

```bash
git add src/components/quote/QuoteActions.tsx src/pages/home/HomePage.tsx src/pages/home/HomePage.test.tsx
git commit -m "feat: soften homepage quote actions"
```

## Chunk 3: Verification And Cleanup

### Task 6: Reconcile homepage interaction tests with the new structure

**Files:**
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`

- [ ] **Step 1: Update the remaining interaction tests to use the new quote fixtures and scroll flow**

Make the existing tests align with:

1. first quote loaded via `fetchHitokoto`
2. second quote appearing only after auto-prefetch
3. actions still targeting the active card after scroll
4. auth-gate prompt rendering inline within the full-screen layout

- [ ] **Step 2: Run the homepage test file and get it fully green**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: PASS with no failing homepage tests.

- [ ] **Step 3: Commit the final homepage test updates**

```bash
git add src/pages/home/HomePage.test.tsx
git commit -m "test: align home page tests with hitokoto stream"
```

### Task 7: Run final verification for the homepage change set

**Files:**
- Verify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx`
- Verify: `C:\Users\14798\Desktop\金\src\components\quote\QuoteActions.tsx`
- Verify: `C:\Users\14798\Desktop\金\src\components\quote\QuoteCard.tsx`
- Verify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`

- [ ] **Step 1: Run the focused homepage tests**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: PASS

- [ ] **Step 2: Run the fastest relevant typecheck**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 3: Inspect the final diff**

Run: `git diff -- src/pages/home/HomePage.tsx src/components/quote/QuoteActions.tsx src/components/quote/QuoteCard.tsx src/pages/home/HomePage.test.tsx`  
Expected: Diff is limited to homepage stream behavior, toolbar presentation, and corresponding tests.

- [ ] **Step 4: Commit the verified homepage implementation**

```bash
git add src/pages/home/HomePage.tsx src/components/quote/QuoteActions.tsx src/components/quote/QuoteCard.tsx src/pages/home/HomePage.test.tsx
git commit -m "feat: redesign homepage as a full-screen hitokoto stream"
```

# Remove Works Table Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `works` table and all runtime dependencies so quotes use `source` as the only work metadata.

**Architecture:** The API stops joining `works` and stops returning `work` objects. Frontend consumers and shared types are simplified to render `source` only. Supabase migrations, seeds, and docs are cleaned so a fresh database no longer creates or references `works` or `quotes.work_id`.

**Tech Stack:** TypeScript, React, Vitest, Supabase SQL

---

## Chunk 1: API and Frontend Contract

### Task 1: Lock the API contract with a failing test

**Files:**
- Modify: `api/quotes/index.test.ts`
- Test: `api/quotes/index.test.ts`

- [ ] **Step 1: Add a failing test for GET quote serialization without `work`**

```ts
it("returns quote items without a nested work object", async () => {
  // mock Supabase row with source data only
  // expect serialized item.source to be preserved
  // expect serialized item.work to be omitted
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- api/quotes/index.test.ts`
Expected: FAIL because GET still joins and serializes `works`

- [ ] **Step 3: Write minimal API changes**

```ts
.select("*, people(id, name, role)", { count: "exact" })
```

```ts
// remove works from QuoteRow and from normalized response
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- api/quotes/index.test.ts`
Expected: PASS

### Task 2: Remove frontend `work` usage

**Files:**
- Modify: `src/types/quote.ts`
- Modify: `src/pages/categories/components/QuoteInfiniteList.tsx`
- Test: `src/pages/categories/CategoryQuotesPage.test.tsx`

- [ ] **Step 1: Add or update a failing frontend test if needed**

```ts
// ensure list navigation still works with quote items that only have source
```

- [ ] **Step 2: Run frontend test to verify current behavior**

Run: `npm test -- src/pages/categories/CategoryQuotesPage.test.tsx`
Expected: PASS before refactor, still exercising source-only items

- [ ] **Step 3: Remove `QuoteWork` and `Quote.work`, render `source` directly**

```ts
<span>{item.source || "未知"}</span>
```

- [ ] **Step 4: Run frontend test to verify it passes**

Run: `npm test -- src/pages/categories/CategoryQuotesPage.test.tsx`
Expected: PASS

## Chunk 2: Supabase Asset Cleanup

### Task 3: Remove `works` from migrations, seeds, and docs

**Files:**
- Modify: `supabase/migrations/20260322_people_works_quotes.sql`
- Modify: `supabase/seeds/quotes-curated.sql`
- Delete: `supabase/seeds/works.sql`
- Modify: `supabase/README.md`
- Modify: `scripts/init-remote-db.mjs`

- [ ] **Step 1: Remove schema and seed references to `works`**

```sql
-- delete create table public.works
-- delete quotes.work_id foreign key and backfill
-- remove joins against public.works
```

- [ ] **Step 2: Remove remote init script references**

```js
// stop executing supabase/seeds/works.sql
```

- [ ] **Step 3: Run targeted searches for residual references**

Run: `Get-ChildItem -Recurse -File api,src,supabase,scripts | Select-String -Pattern '\bworks\b|\bwork_id\b'`
Expected: no runtime references, only unrelated text if any

## Chunk 3: Verification

### Task 4: Run focused verification

**Files:**
- Test: `api/quotes/index.test.ts`
- Test: `src/pages/categories/CategoryQuotesPage.test.tsx`

- [ ] **Step 1: Run API test**

Run: `npm test -- api/quotes/index.test.ts`
Expected: PASS

- [ ] **Step 2: Run category page test**

Run: `npm test -- src/pages/categories/CategoryQuotesPage.test.tsx`
Expected: PASS

- [ ] **Step 3: Search for removed contract references**

Run: `Get-ChildItem -Recurse -File api,src,supabase,scripts | Select-String -Pattern '\bworks\b|\bwork_id\b|item\.work\b|QuoteWork'`
Expected: no remaining production references

# Categories People Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two low-value category tab header cards, drive author and singer entry lists from the database, and migrate category browsing to a lightweight `people / works / quotes` model that treats songs as belonging directly to singers.

**Architecture:** Add `people` and `works` as first-class content tables, link `quotes` to them with foreign keys, and expose a new `/api/people` endpoint plus `personId` filtering on `/api/quotes`. Keep Hitokoto category browsing as-is, but replace hard-coded author/singer constants with API-backed people queries in the categories page.

**Tech Stack:** Vite, React 19, TypeScript, Vitest, Vercel Functions, Supabase Postgres, Node seed scripts

---

## File Map

**Database**

- Create: `C:\Users\14798\Desktop\金\supabase\migrations\20260322_people_works_quotes.sql`
- Create: `C:\Users\14798\Desktop\金\supabase\seeds\people.sql`
- Create: `C:\Users\14798\Desktop\金\supabase\seeds\works.sql`
- Create: `C:\Users\14798\Desktop\金\supabase\seeds\quotes-curated.sql`
- Modify: `C:\Users\14798\Desktop\金\supabase\seed.sql`
- Modify: `C:\Users\14798\Desktop\金\scripts\init-remote-db.mjs`
- Modify: `C:\Users\14798\Desktop\金\supabase\README.md`

**Backend**

- Create: `C:\Users\14798\Desktop\金\api\people\index.ts`
- Create: `C:\Users\14798\Desktop\金\api\people\index.test.ts`
- Create: `C:\Users\14798\Desktop\金\api\people\query.ts`
- Modify: `C:\Users\14798\Desktop\金\api\quotes\index.ts`
- Modify: `C:\Users\14798\Desktop\金\api\quotes\query.ts`
- Modify: `C:\Users\14798\Desktop\金\api\quotes\index.test.ts`

**Frontend types and services**

- Create: `C:\Users\14798\Desktop\金\src\types\person.ts`
- Modify: `C:\Users\14798\Desktop\金\src\types\quote.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\api\people.ts`
- Modify: `C:\Users\14798\Desktop\金\src\services\api\quotes.ts`
- Modify: `C:\Users\14798\Desktop\金\src\services\api\services.test.ts`

**Frontend categories page**

- Modify: `C:\Users\14798\Desktop\金\src\constants\categories.ts`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\CategoriesPage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\CategoriesPage.test.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\components\CategoryFilters.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\components\CategoryQuoteGrid.tsx`

---

## Chunk 1: Database Model And Seed Layout

### Task 1: Add the `people` and `works` migration

**Files:**
- Create: `C:\Users\14798\Desktop\金\supabase\migrations\20260322_people_works_quotes.sql`
- Modify: `C:\Users\14798\Desktop\金\supabase\migrations\20260321_initial_schema.sql`

- [ ] **Step 1: Write the migration skeleton with additive changes only**

```sql
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  aliases text[] null,
  bio text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_role_check check (role in ('author', 'singer')),
  constraint people_name_role_unique unique (name, role)
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  work_type text not null,
  published_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint works_type_check check (work_type in ('book', 'song', 'speech', 'interview', 'essay', 'other'))
);

alter table public.quotes add column if not exists person_id uuid references public.people(id);
alter table public.quotes add column if not exists work_id uuid references public.works(id);
alter table public.quotes add column if not exists excerpt_type text not null default 'quote';
alter table public.quotes add column if not exists verified boolean not null default false;
```

- [ ] **Step 2: Backfill old quote rows into the new shape**

```sql
insert into public.people (name, role)
select distinct author, author_role
from public.quotes
where author is not null
  and author_role in ('author', 'singer')
on conflict (name, role) do nothing;

update public.quotes q
set person_id = p.id
from public.people p
where q.person_id is null
  and p.name = q.author
  and p.role = q.author_role;
```

- [ ] **Step 3: Tighten constraints after backfill**

```sql
alter table public.quotes
  alter column person_id set not null;

create index if not exists people_role_idx on public.people(role);
create index if not exists quotes_person_idx on public.quotes(person_id);
create index if not exists quotes_work_idx on public.quotes(work_id);
```

- [ ] **Step 4: Keep the legacy `author` and `author_role` columns during the transition**

Reason: current favorites, heartbeats, and quote list behavior all depend on them. Do not drop them in this plan.

- [ ] **Step 5: Verify migration ordering**

Run: `Get-ChildItem C:\Users\14798\Desktop\金\supabase\migrations | Select-Object Name`

Expected: the new `20260322_people_works_quotes.sql` file appears after `20260321_initial_schema.sql`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260322_people_works_quotes.sql
git commit -m "feat: add people and works schema"
```

### Task 2: Split seed content into maintainable files

**Files:**
- Create: `C:\Users\14798\Desktop\金\supabase\seeds\people.sql`
- Create: `C:\Users\14798\Desktop\金\supabase\seeds\works.sql`
- Create: `C:\Users\14798\Desktop\金\supabase\seeds\quotes-curated.sql`
- Modify: `C:\Users\14798\Desktop\金\supabase\seed.sql`
- Modify: `C:\Users\14798\Desktop\金\scripts\init-remote-db.mjs`
- Modify: `C:\Users\14798\Desktop\金\supabase\README.md`

- [ ] **Step 1: Reduce `seed.sql` to only minimal bootstrap rows**

Keep just enough rows to prove the app loads and the migration backfill works.

- [ ] **Step 2: Add curated seed files in dependency order**

```sql
-- people.sql
insert into public.people (name, role, aliases)
values
  ('鲁迅', 'author', array['周树人']),
  ('周杰伦', 'singer', null)
on conflict (name, role) do nothing;
```

```sql
-- works.sql
insert into public.works (title, work_type)
values
  ('朝花夕拾', 'book'),
  ('晴天', 'song')
on conflict do nothing;
```

- [ ] **Step 3: Seed quotes by joining natural keys to foreign keys**

```sql
insert into public.quotes (content, author, author_role, source, category, source_type, person_id, work_id, excerpt_type, verified)
select
  '我家门前有两棵树，一棵是枣树，另一棵也是枣树。',
  '鲁迅',
  'author',
  '秋夜',
  '文学',
  'seed',
  p.id,
  w.id,
  'quote',
  true
from public.people p
left join public.works w on w.title = '朝花夕拾'
where p.name = '鲁迅' and p.role = 'author'
on conflict do nothing;
```

- [ ] **Step 4: Load the new files in `init-remote-db.mjs`**

```js
const sqlFiles = [
  path.join(projectRoot, 'supabase', 'migrations', '20260321_initial_schema.sql'),
  path.join(projectRoot, 'supabase', 'migrations', '20260322_people_works_quotes.sql'),
  path.join(projectRoot, 'supabase', 'seed.sql'),
  path.join(projectRoot, 'supabase', 'seeds', 'people.sql'),
  path.join(projectRoot, 'supabase', 'seeds', 'works.sql'),
  path.join(projectRoot, 'supabase', 'seeds', 'quotes-curated.sql'),
];
```

- [ ] **Step 5: Document the new seed flow**

Add a short section to `supabase/README.md` describing:
- bootstrap schema
- minimal seed
- curated content seed
- rerun behavior (`on conflict do nothing`)

- [ ] **Step 6: Verify seed bootstrap command**

Run: `npm run db:init:remote`

Expected: each SQL file logs `Running ...` then `Finished ...`. If the environment is not configured, stop and document that verification remains pending.

- [ ] **Step 7: Commit**

```bash
git add supabase/seed.sql supabase/seeds scripts/init-remote-db.mjs supabase/README.md
git commit -m "feat: split curated quote seeds"
```

---

## Chunk 2: Backend Query Contracts

### Task 3: Add `/api/people`

**Files:**
- Create: `C:\Users\14798\Desktop\金\api\people\query.ts`
- Create: `C:\Users\14798\Desktop\金\api\people\index.ts`
- Create: `C:\Users\14798\Desktop\金\api\people\index.test.ts`

- [ ] **Step 1: Write failing tests for people listing**

```ts
it('returns authors ordered by quote count', async () => {
  const response = await GET(new Request('https://example.com/api/people?role=author&page=1&pageSize=4'));
  expect(response.status).toBe(200);
});

it('returns 400 for invalid role', async () => {
  const response = await GET(new Request('https://example.com/api/people?role=actor'));
  expect(response.status).toBe(400);
});
```

- [ ] **Step 2: Run the new test file and verify failure**

Run: `npm run test -- api/people/index.test.ts`

Expected: FAIL because the new endpoint files do not exist yet.

- [ ] **Step 3: Add query parsing with validation**

```ts
const VALID_ROLES = new Set(['author', 'singer']);

export function parsePeopleQuery(url: URL) {
  const role = readValue(url.searchParams.get('role'));
  if (role && !VALID_ROLES.has(role)) {
    return { code: 'INVALID_PERSON_ROLE', message: 'role 参数无效。' };
  }
  return { role, keyword, page, pageSize };
}
```

- [ ] **Step 4: Implement the endpoint with quote counts**

Implementation requirements:
- anonymous access only is fine
- query `people`
- join or aggregate quote counts from `quotes`
- support `role`, `keyword`, `page`, `pageSize`
- only return people with at least one quote

- [ ] **Step 5: Run tests and make them pass**

Run: `npm run test -- api/people/index.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/people
git commit -m "feat: add people listing api"
```

### Task 4: Extend `/api/quotes` with `personId`

**Files:**
- Modify: `C:\Users\14798\Desktop\金\api\quotes\query.ts`
- Modify: `C:\Users\14798\Desktop\金\api\quotes\index.ts`
- Modify: `C:\Users\14798\Desktop\金\api\quotes\index.test.ts`

- [ ] **Step 1: Add failing tests for `personId` queries**

```ts
it('filters quotes by personId', async () => {
  const response = await GET(new Request('https://example.com/api/quotes?personId=person-1&page=1&pageSize=10'));
  expect(response.status).toBe(200);
});
```

- [ ] **Step 2: Run the quote API tests**

Run: `npm run test -- api/quotes/index.test.ts`

Expected: FAIL because `personId` is ignored and the payload shape is incomplete.

- [ ] **Step 3: Extend query parsing**

```ts
export interface QuoteQueryParams {
  category: string | null;
  author: string | null;
  authorRole: AuthorRole | null;
  personId: string | null;
  keyword: string | null;
  page: number;
  pageSize: number;
}
```

- [ ] **Step 4: Update quote list selection**

Implementation requirements:
- filter by `person_id` when `personId` is present
- select related `people` and `works` data
- return a normalized `person` object and optional `work` object
- keep current auth and viewerState behavior intact

- [ ] **Step 5: Preserve compatibility with existing callers**

During this migration, keep `author` and `authorRole` filters working for old paths and tests.

- [ ] **Step 6: Re-run API tests**

Run: `npm run test -- api/quotes/index.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add api/quotes
git commit -m "feat: support person-based quote queries"
```

---

## Chunk 3: Frontend Types And Categories Page

### Task 5: Add frontend `people` client and types

**Files:**
- Create: `C:\Users\14798\Desktop\金\src\types\person.ts`
- Modify: `C:\Users\14798\Desktop\金\src\types\quote.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\api\people.ts`
- Modify: `C:\Users\14798\Desktop\金\src\services\api\quotes.ts`
- Modify: `C:\Users\14798\Desktop\金\src\services\api\services.test.ts`

- [ ] **Step 1: Add the failing API service tests**

```ts
await getPeople({ role: 'author', keyword: '鲁', page: 1, pageSize: 4 });
expect(apiRequest).toHaveBeenCalledWith('/api/people?role=author&keyword=%E9%B2%81&page=1&pageSize=4');
```

- [ ] **Step 2: Run the service tests**

Run: `npm run test -- src/services/api/services.test.ts`

Expected: FAIL because `getPeople` does not exist yet.

- [ ] **Step 3: Add the new types**

```ts
export interface PersonListItem {
  id: string;
  name: string;
  role: 'author' | 'singer';
  quoteCount: number;
}
```

```ts
export interface QuotePerson {
  id: string;
  name: string;
  role: 'author' | 'singer';
}
```

- [ ] **Step 4: Implement `getPeople` and extend quote types**

Requirements:
- mirror the existing `getQuotes` query builder style
- keep new types additive
- do not break current `QuoteListItem` consumers

- [ ] **Step 5: Re-run the service tests**

Run: `npm run test -- src/services/api/services.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types src/services/api
git commit -m "feat: add people api client"
```

### Task 6: Replace hard-coded author/singer constants with API-backed lists

**Files:**
- Modify: `C:\Users\14798\Desktop\金\src\constants\categories.ts`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\CategoriesPage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\components\CategoryFilters.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\components\CategoryQuoteGrid.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\CategoriesPage.test.tsx`

- [ ] **Step 1: Update the page tests to reflect the new UI**

Add tests that assert:
- `Discover` is gone
- `Matches` is gone
- people lists load from API
- clicking a person calls `getQuotes({ personId, ... })`

```tsx
expect(screen.queryByText('Discover')).not.toBeInTheDocument();
expect(screen.queryByText('Matches')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the categories page tests**

Run: `npm run test -- src/pages/categories/CategoriesPage.test.tsx`

Expected: FAIL because the component still uses static constants and old headings.

- [ ] **Step 3: Remove the top `Discover` card**

Implementation requirements:
- delete the intro wrapper block from `CategoriesPage.tsx`
- keep section spacing balanced after removal

- [ ] **Step 4: Convert `CategoryFilters` to consume people data**

Implementation requirements:
- keep Hitokoto categories local
- fetch authors and singers separately through `getPeople`
- paginate locally within fetched pages only if needed
- search input should refetch people using the current keyword
- pass selected person objects up instead of plain name strings

- [ ] **Step 5: Convert quote loading to `personId`**

Example implementation shape:

```ts
async function handlePersonSelect(person: PersonListItem) {
  setResultsTitle(`${person.role === 'author' ? '作者' : '歌手'}：${person.name}`);
  const response = await getQuotes({ personId: person.id, page: 1, pageSize: PAGE_SIZE });
  setItems(response.items);
}
```

- [ ] **Step 6: Remove the `Matches` eyebrow block from the result component**

Keep:
- loading state
- empty state
- error state
- result cards

- [ ] **Step 7: Re-run page tests**

Run: `npm run test -- src/pages/categories/CategoriesPage.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/constants/categories.ts src/pages/categories
git commit -m "feat: drive categories people lists from api"
```

---

## Chunk 4: Curated Content Import And Final Verification

### Task 7: Prepare the first curated content batch

**Files:**
- Modify: `C:\Users\14798\Desktop\金\supabase\seeds\people.sql`
- Modify: `C:\Users\14798\Desktop\金\supabase\seeds\works.sql`
- Modify: `C:\Users\14798\Desktop\金\supabase\seeds\quotes-curated.sql`

- [ ] **Step 1: Add the first batch with a small, reviewable scope**

Target:
- authors: 8 to 12 people
- singers: 6 to 8 people
- total quotes: about 120

- [ ] **Step 2: Mark curated rows as verified only when the source is manually checked**

```sql
verified = true
```

Use `verified = false` for rows staged before manual confirmation.

- [ ] **Step 3: Keep songs attached to singers only**

Do not add lyricist or composer metadata in this plan.

- [ ] **Step 4: Re-run the seed bootstrap command if database credentials exist**

Run: `npm run db:init:remote`

Expected: PASS with all SQL files applied in order.

- [ ] **Step 5: Commit**

```bash
git add supabase/seeds
git commit -m "feat: add first curated people batch"
```

### Task 8: Run the fastest full verification pass

**Files:**
- No code changes expected

- [ ] **Step 1: Run the targeted backend and frontend tests**

Run: `npm run test -- api/people/index.test.ts api/quotes/index.test.ts src/services/api/services.test.ts src/pages/categories/CategoriesPage.test.tsx`

Expected: PASS

- [ ] **Step 2: Run type checking**

Run: `npm run lint`

Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: PASS

- [ ] **Step 4: Review the final diff**

Run: `git diff --stat`

Expected: only the planned database, API, categories page, and seed files are listed.

- [ ] **Step 5: Commit the integration checkpoint**

```bash
git add .
git commit -m "feat: finish categories people migration"
```

---

## Notes For The Implementer

- Keep diffs small and reviewable. Do not refactor unrelated pages.
- Preserve existing `author` and `author_role` behavior until all callers move to `personId`.
- For this scope, songs belong directly to singers. Do not introduce lyricist or composer relationships.
- If `npm run db:init:remote` cannot run because env vars are missing, note that explicitly instead of guessing.
- The categories page is the only UI target in this plan. Do not leak this model change into home, favorites, or settings unless tests force a minimal compatibility update.

Plan complete and saved to `docs/superpowers/plans/2026-03-22-categories-people-implementation.md`. Ready to execute?

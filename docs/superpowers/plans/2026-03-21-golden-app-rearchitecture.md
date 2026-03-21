# Golden App Re-architecture Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前单文件 Vite React 金句应用重构为四个一级页面，并完成 `Supabase Auth + Postgres + Vercel Functions` 落地，补齐测试、部署配置与架构文档。

**Architecture:** 先建立测试基建与路由壳层，再接入 Supabase Auth、Schema 与服务端公共库，然后按接口契约实现 Vercel Functions 和前端 API client，最后迁移 UI、清理 Firebase、补完部署文档。用户私有数据通过 JWT + RLS 保护，公共金句列表支持匿名访问并在登录态下返回 `viewerState`。

**Tech Stack:** React 19, TypeScript, Vite, React Router, Supabase Auth, Supabase Postgres, Vercel Functions, Vitest, React Testing Library

---

**Execution Notes**

- 当前 Git 根目录位于 `C:\Users\14798`，不适合在本计划执行过程中直接提交。执行时先建立独立仓库，或采用“无提交检查点 + 明确验证命令”的方式推进。
- 所有真实密钥只通过本地环境或 Vercel/Supabase 控制台注入，不写入仓库。
- 视觉风格尽量保持现状，避免把 UI 重设计和技术迁移混成一个改动面。
- 当前 `npm run lint` 实际承担的是 TypeScript 类型检查，不是 ESLint。

## Chunk 1: Tooling And App Shell

### Task 1: Add Routing, Supabase, And Test Dependencies

**Files:**
- Modify: `C:\Users\14798\Desktop\金\package.json`
- Modify: `C:\Users\14798\Desktop\金\package-lock.json`

- [ ] **Step 1: Add runtime and test dependencies**

Update `package.json` with:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "react-router-dom": "^7.x"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/react": "^16.x",
    "@testing-library/user-event": "^14.x",
    "jsdom": "^26.x",
    "vitest": "^3.x"
  }
}
```

- [ ] **Step 2: Add test scripts**

Add:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Install packages**

Run: `npm install`  
Expected: install completes without peer dependency or lockfile errors.

- [ ] **Step 4: Run a baseline typecheck**

Run: `npm run lint`  
Expected: dependency changes do not introduce immediate type resolution failures.

### Task 2: Configure Vitest And Shared Frontend Foundations

**Files:**
- Create: `C:\Users\14798\Desktop\金\vitest.config.ts`
- Create: `C:\Users\14798\Desktop\金\src\test\setup.ts`
- Create: `C:\Users\14798\Desktop\金\src\utils\cn.ts`
- Create: `C:\Users\14798\Desktop\金\src\types\quote.ts`
- Create: `C:\Users\14798\Desktop\金\src\types\user.ts`
- Create: `C:\Users\14798\Desktop\金\src\types\api.ts`
- Create: `C:\Users\14798\Desktop\金\src\constants\quote-style.ts`
- Create: `C:\Users\14798\Desktop\金\src\constants\categories.ts`
- Modify: `C:\Users\14798\Desktop\金\tsconfig.json`

- [ ] **Step 1: Create a Vitest config that mirrors Vite resolution**

Create `vitest.config.ts`:

```ts
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 2: Add test setup helpers**

Create `src\test\setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Update `tsconfig.json` for tests and aliases**

Ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "types": ["node", "vitest/globals", "@testing-library/jest-dom"]
  }
}
```

- [ ] **Step 4: Extract the first shared utility and type modules**

Move low-risk shared pieces out of the current flat files into:

- `src\utils\cn.ts`
  - move the current `cn(...inputs)` helper from `src\App.tsx`
- `src\types\quote.ts`
  - move `Quote`, `Reflection`, `Heartbeat`, `HitokotoResponse`, `QuoteStyle`
- `src\types\user.ts`
  - move `UserProfile`
- `src\types\api.ts`
  - create `ApiError`, `PaginatedResponse<T>`, and `ViewerState`
- `src\constants\quote-style.ts`
  - move `DEFAULT_STYLE` and `FONT_FAMILIES`
- `src\constants\categories.ts`
  - move `HITOKOTO_CATEGORIES`, `AUTHORS`, and `SINGERS`

Leave `src\types.ts` and `src\constants.ts` in place temporarily if incremental imports make that safer.

- [ ] **Step 5: Verify the test harness compiles**

Run: `npm run lint`  
Expected: alias resolution, Vitest globals, and `jest-dom` types are recognized.

### Task 3: Create The Routed Shell And Placeholder Pages

**Files:**
- Create: `C:\Users\14798\Desktop\金\src\app\router.tsx`
- Create: `C:\Users\14798\Desktop\金\src\app\providers.tsx`
- Create: `C:\Users\14798\Desktop\金\src\app\layout\AppShell.tsx`
- Create: `C:\Users\14798\Desktop\金\src\app\layout\BottomNav.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\categories\CategoriesPage.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\favorites\FavoritesPage.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\settings\SettingsPage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\App.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\main.tsx`
- Test: `C:\Users\14798\Desktop\金\src\app\router.test.tsx`

- [ ] **Step 1: Create the router and placeholder routes**

Build `src\app\router.tsx` with:

```tsx
createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

- [ ] **Step 2: Implement `AppShell` and navigation**

`AppShell.tsx` must render:

- a route container with `<Outlet />`
- shared mobile-width shell styling
- `BottomNav`

`BottomNav.tsx` must derive active state from `useLocation()`.

- [ ] **Step 3: Implement a minimal providers layer**

`providers.tsx` should initially wrap only safe global concerns needed by the shell, for example:

- theme bootstrapping placeholder
- future auth context boundary

Do not add data fetching or business logic yet.

- [ ] **Step 4: Reduce `src\App.tsx` and `src\main.tsx` to bootstrap code**

`App.tsx` should only render providers and the router.  
`main.tsx` should keep strict mode and import the simplified `App`.

- [ ] **Step 5: Add a route smoke test**

Create `src\app\router.test.tsx` using `createMemoryRouter` or an exported route config, covering:

- `/` renders home placeholder
- `/categories` renders categories placeholder
- `/favorites` renders favorites placeholder
- `/settings` renders settings placeholder

- [ ] **Step 6: Run route tests**

Run: `npx vitest run src/app/router.test.tsx`  
Expected: placeholders and shell routes all pass.

- [ ] **Step 7: Run a shell checkpoint**

Run:

- `npm run lint`
- `npm run build`

Expected: routed shell works before any auth or backend integration starts.

## Chunk 2: Supabase Auth And Schema

### Task 4: Add Supabase Browser Session Layer And Auth Pages

**Files:**
- Create: `C:\Users\14798\Desktop\金\src\services\supabase\browser.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\supabase\session.ts`
- Create: `C:\Users\14798\Desktop\金\src\hooks\useAuth.ts`
- Create: `C:\Users\14798\Desktop\金\src\pages\auth\LoginPage.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\auth\RegisterPage.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\auth\ForgotPasswordPage.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\auth\ResetPasswordPage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\app\router.tsx`
- Test: `C:\Users\14798\Desktop\金\src\pages\auth\AuthPages.test.tsx`

- [ ] **Step 1: Create the browser Supabase client**

Create `browser.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

- [ ] **Step 2: Add session helpers**

Create helpers in `session.ts`:

- `getAccessToken()`
- `requireAccessToken()`
- `clearSessionAndRedirect()`

- [ ] **Step 3: Implement `useAuth`**

Expose:

- current session
- current user
- loading state
- `signInWithPassword`
- `signUpWithPassword`
- `sendResetPasswordEmail`
- `updatePassword`
- `signOut`

- [ ] **Step 4: Add auth routes**

Add:

- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`

- [ ] **Step 5: Implement the auth pages**

Implement `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, and `ResetPasswordPage.tsx` with:

- form fields
- submit/loading states
- success and error messaging
- recovery session bootstrap on reset-page load

- [ ] **Step 6: Add auth page tests**

Cover:

- login form validation
- register password confirmation validation
- forgot password success state
- valid reset link establishes recovery session and updates password
- reset password expired-link state

- [ ] **Step 7: Run auth page tests**

Run: `npx vitest run src/pages/auth/AuthPages.test.tsx`  
Expected: auth forms are stable before backend handlers are wired.

- [ ] **Step 8: Verify password recovery routing**

Confirm the forgot-password success path sends users to the reset page with an explicit `redirectTo`, and that valid reset links can call `updatePassword`.

### Task 5: Create Supabase Migration, Seed, And RLS Assets

**Files:**
- Create: `C:\Users\14798\Desktop\金\supabase\migrations\20260321_initial_schema.sql`
- Create: `C:\Users\14798\Desktop\金\supabase\seed.sql`
- Create: `C:\Users\14798\Desktop\金\supabase\README.md`
- Create: `C:\Users\14798\Desktop\金\supabase\config.toml`

- [ ] **Step 1: Create the full schema with explicit fields**

The migration must define:

- `profiles`
  - `id uuid primary key references auth.users(id) on delete cascade`
  - `email text`
  - `display_name text`
  - `avatar_url text`
  - `theme_mode text default 'light'`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- `quotes`
  - `id uuid primary key default gen_random_uuid()`
  - `content text not null`
  - `author text not null`
  - `author_role text default 'unknown'`
  - `source text`
  - `category text`
  - `source_type text`
  - `created_by uuid null`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- `favorites`
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `quote_id uuid not null references quotes(id) on delete cascade`
  - `created_at timestamptz default now()`
- `heartbeats`
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `quote_id uuid not null references quotes(id) on delete cascade`
  - `count integer not null default 0`
  - `last_liked_at timestamptz`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- `reflections`
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `quote_id uuid not null references quotes(id) on delete cascade`
  - `content text not null`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`

Constraints must include:

- `unique(user_id, quote_id)` on `favorites`
- `unique(user_id, quote_id)` on `heartbeats`
- `check (author_role in ('author', 'singer', 'unknown'))` on `quotes`

- [ ] **Step 2: Initialize the local Supabase project files**

If the repository does not yet contain a usable local Supabase project, create one with:

- `npx supabase init`

Then ensure `supabase\config.toml` is present before local migration validation.

- [ ] **Step 3: Add RLS policies**

Policies must explicitly encode:

- `alter table ... enable row level security` on `profiles`, `quotes`, `favorites`, `heartbeats`, and `reflections`
- anonymous and authenticated read on `quotes`
- `insert with check (auth.uid() = id)` on `profiles`
- self `select/insert/update` on `profiles`
- self `select/insert/delete` on `favorites`
- self `select/insert/update` on `heartbeats`
- self `select/insert/update/delete` on `reflections`

- [ ] **Step 4: Document idempotent profile bootstrap**

In `supabase\README.md`, document the required pattern:

```sql
insert into profiles (...) values (...)
on conflict (id) do nothing;
```

- [ ] **Step 5: Add initial quote seeds**

Create `seed.sql` with enough starter quotes to guarantee:

- non-empty home data
- at least one `author_role = 'author'`
- at least one `author_role = 'singer'`
- representative `category` coverage for categories browsing

- [ ] **Step 6: Review the migration artifact**

Run:

- `Get-Content -Raw supabase\\migrations\\20260321_initial_schema.sql`
- `npx supabase db reset --local`

Expected: the migration text matches the spec and applies successfully in a disposable local Supabase environment with a valid `supabase\config.toml`.

### Task 6: Implement Shared Vercel Function Utilities

**Files:**
- Create: `C:\Users\14798\Desktop\金\api\_lib\env.ts`
- Create: `C:\Users\14798\Desktop\金\api\_lib\auth.ts`
- Create: `C:\Users\14798\Desktop\金\api\_lib\http.ts`
- Create: `C:\Users\14798\Desktop\金\api\_lib\supabase.ts`
- Create: `C:\Users\14798\Desktop\金\api\_lib\profile.ts`
- Test: `C:\Users\14798\Desktop\金\api\_lib\auth.test.ts`

- [ ] **Step 1: Add environment validation**

`env.ts` must validate:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 2: Implement shared HTTP helpers**

`http.ts` must centralize:

- JSON success responses
- JSON error responses
- `400/401/404/409/502/500` helpers

- [ ] **Step 3: Add auth parsing helpers**

`auth.ts` must support:

- missing auth header on public routes
- valid bearer token extraction
- malformed bearer header failure
- explicit expired token returns `401`

- [ ] **Step 4: Add server client factories**

`supabase.ts` should expose:

- `createAnonServerClient()`
- `createUserServerClient(token: string)`
- `createServiceRoleClient()`

- [ ] **Step 5: Add idempotent profile bootstrap helper**

`profile.ts` should expose:

```ts
async function ensureProfile(userClient: SupabaseClient, user: AuthUser)
```

It must use `on conflict do nothing` semantics before re-reading the row.

- [ ] **Step 6: Add auth utility tests**

Create `api\_lib\auth.test.ts` covering:

- public request with no auth header
- valid bearer token extraction
- malformed header rejection
- explicit expired token `401`

- [ ] **Step 7: Run utility tests**

Run: `npx vitest run api/_lib/auth.test.ts`  
Expected: auth parsing and failure branches are stable before endpoint handlers exist.

## Chunk 3: Vercel Functions And Frontend API Layer

### Task 7: Implement Quote List And Hitokoto Handlers

**Files:**
- Create: `C:\Users\14798\Desktop\金\api\quotes\index.ts`
- Create: `C:\Users\14798\Desktop\金\api\quotes\fetch-hitokoto.ts`
- Create: `C:\Users\14798\Desktop\金\api\quotes\query.ts`
- Create: `C:\Users\14798\Desktop\金\api\quotes\viewer-state.ts`
- Test: `C:\Users\14798\Desktop\金\api\quotes\index.test.ts`
- Test: `C:\Users\14798\Desktop\金\api\quotes\fetch-hitokoto.test.ts`

- [ ] **Step 1: Write failing tests for `GET /api/quotes`**

Cover:

- anonymous request returns `200`
- anonymous request returns `{ items, page, pageSize, total }`
- invalid explicit token returns `401` before query validation
- invalid pagination returns `400`
- invalid `authorRole` returns `400`
- invalid filter combinations return `400`, specifically:
  - `authorRole=singer` with an `author` value outside the known singer option set
  - `authorRole=author` with an `author` value outside the known author option set
- authenticated request includes `viewerState: { isFavorited, viewerHeartbeatCount }`

- [ ] **Step 2: Run quote list tests to confirm failure**

Run: `npx vitest run api/quotes/index.test.ts`  
Expected: tests fail because the handler does not exist yet.

- [ ] **Step 3: Implement `GET /api/quotes`**

Handler contract:

- accepts `category?`, `author?`, `authorRole?`, `keyword?`, `page?`, `pageSize?`
- anonymous request uses anon client and returns anonymous results
- anonymous and authenticated requests both return `{ items, page, pageSize, total }`
- authenticated request uses user client
- each authenticated item additionally includes `viewerState: { isFavorited, viewerHeartbeatCount }`
- invalid explicit JWT returns `401`
- invalid `page/pageSize/authorRole` returns `400`
- invalid filter combinations return `400`, specifically:
  - `authorRole=singer` with an `author` value outside the known singer option set
  - `authorRole=author` with an `author` value outside the known author option set

- [ ] **Step 4: Write failing tests for `POST /api/quotes/fetch-hitokoto`**

Cover:

- valid proxy returns `{ quote }`
- invalid category returns `400`
- upstream failure returns `502`
- proxy call does not write into `quotes`

- [ ] **Step 5: Run hitokoto tests to confirm failure**

Run: `npx vitest run api/quotes/fetch-hitokoto.test.ts`  
Expected: tests fail because the proxy does not exist yet.

- [ ] **Step 6: Implement `POST /api/quotes/fetch-hitokoto`**

Handler contract:

- accepts `{ category?: string }`
- proxies `https://v1.hitokoto.cn`
- validates category input
- standardizes the success payload to `{ quote }`
- never persists into `quotes`
- upstream failures return `502`

- [ ] **Step 7: Run quote handler tests**

Run: `npx vitest run api/quotes/index.test.ts api/quotes/fetch-hitokoto.test.ts`  
Expected: quote handlers match optional-auth, priority `401`, and proxy response-shape requirements.

### Task 8: Implement Favorites And Heartbeats Handlers

**Files:**
- Create: `C:\Users\14798\Desktop\金\api\favorites\index.ts`
- Create: `C:\Users\14798\Desktop\金\api\favorites\[quoteId].ts`
- Create: `C:\Users\14798\Desktop\金\api\heartbeats\[quoteId].ts`
- Test: `C:\Users\14798\Desktop\金\api\favorites\index.test.ts`
- Test: `C:\Users\14798\Desktop\金\api\favorites\quote-id.test.ts`
- Test: `C:\Users\14798\Desktop\金\api\heartbeats\quote-id.test.ts`

- [ ] **Step 1: Write failing tests for `GET /api/favorites`**

Cover:

- protected route `401`
- category filter and pagination
- response shape `{ items, page, pageSize, total }`
- each item includes `viewerState: { isFavorited: true, viewerHeartbeatCount }`

- [ ] **Step 2: Run favorites list tests to confirm failure**

Run: `npx vitest run api/favorites/index.test.ts`  
Expected: tests fail because the handler does not exist yet.

- [ ] **Step 3: Implement `GET /api/favorites`**

Handler contract:

- requires valid JWT
- accepts `category?`, `page?`, `pageSize?`
- returns `{ items, page, pageSize, total }`
- each item includes `viewerState: { isFavorited: true, viewerHeartbeatCount }`

- [ ] **Step 4: Write failing tests for favorite mutation handlers**

Cover:

- create idempotency
- delete idempotency
- `POST /api/favorites/:quoteId` returns `404` for missing quote
- `POST /api/favorites/:quoteId` returns `{ favorited: true }`
- `DELETE /api/favorites/:quoteId` returns `{ favorited: false }`
- protected route `401`

- [ ] **Step 5: Implement `POST /api/favorites/:quoteId` and `DELETE /api/favorites/:quoteId`**

Contracts:

- `POST` is idempotent when already favorited
- `DELETE` is idempotent when already absent
- missing quote returns `404` where the spec requires existence checks

- [ ] **Step 6: Write failing tests for `POST /api/heartbeats/:quoteId`**

Cover:

- protected route `401`
- missing quote returns `404`
- one successful request increments by exactly `1`
- success payload is `{ quoteId, count }`

- [ ] **Step 7: Implement `POST /api/heartbeats/:quoteId`**

Contract:

- requires valid JWT
- missing quote returns `404`
- one successful request increments by exactly `1`
- returns `{ quoteId, count }`

- [ ] **Step 8: Run favorites and heartbeats tests**

Run: `npx vitest run api/favorites/index.test.ts api/favorites/quote-id.test.ts api/heartbeats/quote-id.test.ts`  
Expected: auth, `404`, idempotency, and increment semantics match the spec.

### Task 9: Implement Reflections And Profile Handlers

**Files:**
- Create: `C:\Users\14798\Desktop\金\api\reflections\index.ts`
- Create: `C:\Users\14798\Desktop\金\api\profile.ts`
- Test: `C:\Users\14798\Desktop\金\api\reflections\index.test.ts`
- Test: `C:\Users\14798\Desktop\金\api\profile.test.ts`

- [ ] **Step 1: Write failing tests for `GET /api/reflections`**

Cover:

- protected route `401`
- missing `quoteId` returns `400`
- valid request returns only current user's reflections
- success payload is `{ items }`

- [ ] **Step 2: Implement `GET /api/reflections`**

Contract:

- requires valid JWT
- validates `quoteId`
- returns `400/401` only
- does not convert empty result sets into `404`

- [ ] **Step 3: Write failing tests for `POST /api/reflections`**

Cover:

- missing `quoteId` or content returns `400`
- missing quote returns `404`
- success returns `{ reflection }`

- [ ] **Step 4: Implement `POST /api/reflections`**

Contract:

- requires valid JWT
- accepts `{ quoteId, content }`
- invalid `quoteId` or missing content returns `400`
- missing quote returns `404`
- success payload is `{ reflection }`

- [ ] **Step 5: Write failing tests for profile handlers**

Cover:

- unauthenticated profile request returns `401`
- first profile request auto-creates profile
- second profile request is idempotent
- success response is wrapped as `{ profile }`
- invalid patch payload returns `400`

- [ ] **Step 6: Implement `GET /api/profile` and `PATCH /api/profile`**

Contracts:

- require valid JWT
- both handlers call `ensureProfile`
- `PATCH` only accepts `displayName`, `avatarUrl`, `themeMode`
- invalid patch values return `400`

- [ ] **Step 7: Run reflections and profile tests**

Run: `npx vitest run api/reflections/index.test.ts api/profile.test.ts`  
Expected: reflection validation and profile bootstrap match the spec.

### Task 10: Create Frontend API Client Layer

**Files:**
- Create: `C:\Users\14798\Desktop\金\src\services\api\client.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\api\quotes.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\api\favorites.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\api\heartbeats.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\api\reflections.ts`
- Create: `C:\Users\14798\Desktop\金\src\services\api\profile.ts`
- Test: `C:\Users\14798\Desktop\金\src\services\api\client.test.ts`
- Test: `C:\Users\14798\Desktop\金\src\services\api\services.test.ts`

- [ ] **Step 1: Write failing tests for the shared fetch wrapper**

Cover:

- token header inclusion
- missing token behavior
- structured `401` handling
- JSON body serialization

- [ ] **Step 2: Implement the shared fetch wrapper**

`client.ts` must:

- attach `Authorization` only when a token exists
- preserve `401` rather than swallowing it
- serialize JSON request bodies
- parse JSON error payloads consistently

- [ ] **Step 3: Write failing tests for typed service modules**

Cover:

- method/path mapping for each service module
- body payload mapping for create/update mutations

- [ ] **Step 4: Implement typed service modules**

Create wrappers for:

- `getQuotes`
- `fetchHitokoto`
- `getFavorites`
- `favoriteQuote`
- `unfavoriteQuote`
- `heartbeatQuote`
- `getReflections`
- `createReflection`
- `getProfile`
- `updateProfile`

- [ ] **Step 5: Run API client tests**

Run: `npx vitest run src/services/api/client.test.ts src/services/api/services.test.ts`  
Expected: frontend API access is stable before UI migration begins.

## Chunk 4: UI Migration

### Task 11: Extract Home Page Quote Experience

**Files:**
- Create: `C:\Users\14798\Desktop\金\src\components\quote\QuoteCard.tsx`
- Create: `C:\Users\14798\Desktop\金\src\components\quote\QuoteActions.tsx`
- Create: `C:\Users\14798\Desktop\金\src\components\quote\QuoteDetailModal.tsx`
- Create: `C:\Users\14798\Desktop\金\src\components\common\LoadingScreen.tsx`
- Create: `C:\Users\14798\Desktop\金\src\components\reflection\ReflectionPanel.tsx`
- Create: `C:\Users\14798\Desktop\金\src\components\style\StyleEditorDrawer.tsx`
- Create: `C:\Users\14798\Desktop\金\src\utils\export-image.ts`
- Create: `C:\Users\14798\Desktop\金\src\hooks\useQuotes.ts`
- Create: `C:\Users\14798\Desktop\金\src\hooks\useFavorites.ts`
- Create: `C:\Users\14798\Desktop\金\src\hooks\useReflections.ts`
- Create: `C:\Users\14798\Desktop\金\src\hooks\useTheme.ts`
- Modify: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.tsx`
- Test: `C:\Users\14798\Desktop\金\src\pages\home\HomePage.test.tsx`

- [ ] **Step 1: Move home-page state into focused hooks**

Split the current `src\App.tsx` home concerns into:

- `useQuotes` for quote list, current index, hitokoto fetch, and selected quote state
- `useFavorites` for favorite and heartbeat mutations
- `useReflections` for loading and creating reflections tied to the selected quote
- `useTheme` for dark mode and quote style persistence

- [ ] **Step 2: Extract quote presentation components**

Create:

- `QuoteCard`
- `QuoteActions`
- `QuoteDetailModal`

They must receive data and callbacks through props, not import API modules directly.

- [ ] **Step 3: Extract reflection and style components**

Create:

- `ReflectionPanel`
- `StyleEditorDrawer`

They should stay UI-focused and read/write through props fed by hooks.

- [ ] **Step 4: Compose `HomePage.tsx` from the extracted modules**

`HomePage.tsx` should own panel open/close state and use `useQuotes` as the single source of selected quote data.

- [ ] **Step 5: Add a home page test**

Cover:

- loading state
- scroll-driven current quote switching
- opening detail modal
- auth gate for protected action when not logged in
- export current card action
- `401` recovery path for protected requests
- hitokoto failure preserves already loaded content

- [ ] **Step 6: Run home page tests**

Run: `npx vitest run src/pages/home/HomePage.test.tsx`  
Expected: the routed home page remains interactive after extraction.

### Task 12: Rebuild Categories, Favorites, And Settings Pages

**Files:**
- Create: `C:\Users\14798\Desktop\金\src\components\common\SearchBar.tsx`
- Create: `C:\Users\14798\Desktop\金\src\components\common\EmptyState.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\categories\components\CategoryFilters.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\categories\components\CategoryQuoteGrid.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\favorites\components\FavoriteToolbar.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\favorites\components\FavoriteGroups.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\settings\components\ProfileCard.tsx`
- Create: `C:\Users\14798\Desktop\金\src\pages\settings\components\AuthEntryLinks.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\categories\CategoriesPage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\favorites\FavoritesPage.tsx`
- Modify: `C:\Users\14798\Desktop\金\src\pages\settings\SettingsPage.tsx`
- Test: `C:\Users\14798\Desktop\金\src\pages\categories\CategoriesPage.test.tsx`
- Test: `C:\Users\14798\Desktop\金\src\pages\favorites\FavoritesPage.test.tsx`
- Test: `C:\Users\14798\Desktop\金\src\pages\settings\SettingsPage.test.tsx`

- [ ] **Step 1: Rebuild the categories page from smaller page components**

Features to cover:

- category chips
- author/artist filtering via `authorRole` and concrete author/artist names
- keyword search
- service-triggered hitokoto fetch
- empty and error states

- [ ] **Step 2: Rebuild the favorites page from smaller page components**

Features to cover:

- authenticated-only favorites fetch
- category grouping in frontend
- gallery/list toggle in frontend
- detail modal reuse

- [ ] **Step 3: Rebuild the settings page from smaller page components**

Features to cover:

- current profile display
- theme controls
- logout action
- auth entry links

- [ ] **Step 4: Add page-level tests**

Cover:

- categories filter + keyword search + empty/error states
- favorites anonymous gate + gallery/list toggle + grouped rendering
- categories service-triggered hitokoto fetch
- favorites session-expired `401` recovery
- settings profile bootstrap render + logout action + auth entry navigation + session-expired `401` recovery

- [ ] **Step 5: Run page tests**

Run: `npx vitest run src/pages/categories/CategoriesPage.test.tsx src/pages/favorites/FavoritesPage.test.tsx src/pages/settings/SettingsPage.test.tsx`  
Expected: all three primary pages match routed behavior and core user flows.

- [ ] **Step 6: Run a post-migration page checkpoint**

Run:

- `npx vitest run src/pages/home/HomePage.test.tsx src/pages/categories/CategoriesPage.test.tsx src/pages/favorites/FavoritesPage.test.tsx src/pages/settings/SettingsPage.test.tsx`
- `npm run build`

Expected: page migrations preserve main flows and still produce a valid production build.

## Chunk 5: Cleanup, Deployment, And Final Verification

### Task 13: Remove Firebase And Align Build Configuration

**Files:**
- Delete: `C:\Users\14798\Desktop\金\src\firebase.ts`
- Delete: `C:\Users\14798\Desktop\金\firebase-applet-config.json`
- Modify: `C:\Users\14798\Desktop\金\package.json`
- Modify: `C:\Users\14798\Desktop\金\package-lock.json`
- Modify: `C:\Users\14798\Desktop\金\vite.config.ts`

- [ ] **Step 1: Capture a pre-cleanup rollback checkpoint**

Before deleting Firebase-era files, preserve:

- current project copy location or archive path
- old Firebase environment variable names and config file list
- current `src/firebase.ts` and `firebase-applet-config.json` contents

If Git isolation is unavailable, create a manual snapshot of `src/`, `api/`, `package.json`, `package-lock.json`, `vite.config.ts`, and config files before cleanup starts.

- [ ] **Step 2: Remove Firebase imports from the codebase**

No source file should import:

- `firebase`
- `src/firebase.ts`
- `firebase-applet-config.json`

- [ ] **Step 3: Remove dead dependencies**

Delete unused packages from `package.json` and refresh `package-lock.json`, especially:

- `firebase`
- `@google/genai`
- `express`
- `dotenv`

Keep any package only if it is still imported after the migration.

- [ ] **Step 4: Remove obsolete Vite environment injection**

Delete the `process.env.GEMINI_API_KEY` define block from `vite.config.ts` unless a remaining feature still requires it.

- [ ] **Step 5: Verify no runtime Firebase or Gemini config references remain**

Run:

- `Get-ChildItem -Recurse -File src,api | Select-String -Pattern 'firebase|GEMINI_API_KEY'`
- `Select-String -Path package.json,package-lock.json,vite.config.ts -Pattern 'firebase|GEMINI_API_KEY'`

Expected: no runtime source or build-config references remain; documentation matches are ignored in this check.

- [ ] **Step 6: Re-run compile checks after cleanup**

Run:

- `npm run lint`
- `npm run build`

Expected: typecheck and production build succeed without Firebase-era artifacts.

### Task 14: Add Deployment And Architecture Documentation

**Files:**
- Create: `C:\Users\14798\Desktop\金\docs\architecture\`
- Create: `C:\Users\14798\Desktop\金\docs\architecture\app-architecture.md`
- Create: `C:\Users\14798\Desktop\金\vercel.json`
- Modify: `C:\Users\14798\Desktop\金\.env.example`
- Modify: `C:\Users\14798\Desktop\金\README.md`

- [ ] **Step 1: Write the architecture document**

Create `docs\architecture\app-architecture.md` with:

- current architecture
- target architecture
- migration path
- auth/session flow
- API surface
- database overview

- [ ] **Step 2: Add Vercel routing config**

Create `vercel.json` so:

- `/api/*` stays on Vercel Functions
- frontend routes rewrite to `index.html`
- static assets such as `/assets/*` are not broken by the SPA rewrite

Example:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 3: Update `.env.example`**

Document placeholders for:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Also document the required Supabase Auth console settings for:

- site URL
- password reset `redirectTo`

- [ ] **Step 4: Rewrite `README.md` for the new stack**

Document:

- local setup
- test command
- build command
- Supabase migration and seed steps
- Vercel deployment variables

- [ ] **Step 5: Run final verification**

Run:

- `npm run test`
- `npm run lint`
- `npm run build`
- `npx vercel build`

Expected:

- tests pass
- typecheck passes
- production build succeeds
- Vercel build recognizes the frontend and `api/*` routes without rewrite conflicts

Precondition:

- link or configure the project so `npx vercel build` has the required environment variables

- [ ] **Step 6: Capture a worktree checkpoint**

Run:

- `git rev-parse --show-toplevel`
- `git status --short -- .`

Expected: confirm the actual Git root first, then inspect project-local modifications from `C:\Users\14798\Desktop\金`. If the root is still `C:\Users\14798`, record a manual checkpoint as `Get-ChildItem -Recurse docs,src,api,supabase | Select-Object FullName,LastWriteTime` instead of relying on a misleading Git path filter.

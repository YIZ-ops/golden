# Settings MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成设置页的个人资料编辑、主题实际生效、密码修改三项能力，并修正 profile patch 的更新语义。

**Architecture:** 保持单页设置结构，沿用现有 `SettingsPage + profile API + useAuth`。新增轻量主题提供层统一管理实际主题和模式切换；后端仅收敛 `PATCH /api/profile` 的字段更新语义，不引入额外服务。

**Tech Stack:** React 19, React Router, TypeScript, Vitest, Testing Library, Vercel Functions, Supabase Auth

---

## Chunk 1: Profile Patch Semantics

### Task 1: 为 profile patch 解析补失败测试

**Files:**
- Create: `api/profile.test.ts`
- Modify: `api/profile.ts`
- Test: `api/profile.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('only updates fields present in the request body', async () => {
  // request body only includes displayName
  // expect parsed patch to keep avatar/theme untouched
});

it('treats empty strings as explicit clears for displayName and avatarUrl', async () => {
  // request body includes displayName: '' and avatarUrl: ''
  // expect normalized values to be null clears, not invalid patch
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- api/profile.test.ts`
Expected: FAIL because parser is not exported or current semantics reject the cases above.

- [ ] **Step 3: Write minimal implementation**

```ts
function parseProfilePatch(body: Record<string, unknown>) {
  const hasDisplayName = Object.prototype.hasOwnProperty.call(body, 'displayName');
  const hasAvatarUrl = Object.prototype.hasOwnProperty.call(body, 'avatarUrl');
  const hasThemeMode = Object.prototype.hasOwnProperty.call(body, 'themeMode');
  // validate by field presence, not truthiness
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- api/profile.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/profile.ts api/profile.test.ts
git commit -m "test: cover profile patch semantics"
```

### Task 2: 让 PATCH /api/profile 只更新出现的字段

**Files:**
- Modify: `api/profile.ts`
- Test: `api/profile.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('builds update payload without overwriting omitted fields', async () => {
  // expect update query payload to omit keys not present in request body
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- api/profile.test.ts`
Expected: FAIL because omitted fields are currently sent as null.

- [ ] **Step 3: Write minimal implementation**

```ts
const updatePayload: Record<string, unknown> = {};
if (updates.hasDisplayName) updatePayload.display_name = updates.displayName;
if (updates.hasAvatarUrl) updatePayload.avatar_url = updates.avatarUrl;
if (updates.hasThemeMode) updatePayload.theme_mode = updates.themeMode;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- api/profile.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/profile.ts api/profile.test.ts
git commit -m "fix: preserve omitted profile fields on patch"
```

## Chunk 2: Theme Provider

### Task 3: 为主题解析与系统跟随写失败测试

**Files:**
- Create: `src/app/theme/ThemeProvider.test.tsx`
- Create: `src/app/theme/ThemeProvider.tsx`
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('applies dark theme when mode is dark', () => {
  // expect document element or body to reflect dark theme
});

it('tracks system preference when mode is system', () => {
  // mock matchMedia and expect theme updates
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/theme/ThemeProvider.test.tsx`
Expected: FAIL because provider does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function ThemeProvider({ children }: PropsWithChildren) {
  // hold theme mode + resolved theme
  // expose setThemeMode and apply data attribute/class to document
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/theme/ThemeProvider.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/providers.tsx src/app/theme/ThemeProvider.tsx src/app/theme/ThemeProvider.test.tsx
git commit -m "feat: add application theme provider"
```

## Chunk 3: Settings Page Behaviors

### Task 4: 为资料表单补失败测试

**Files:**
- Create: `src/pages/settings/SettingsPage.test.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/services/api/profile.ts`

- [ ] **Step 1: Write the failing test**

```tsx
it('loads profile values into the profile form', async () => {
  // mock logged-in user + getProfile
});

it('submits only edited profile fields and updates the summary on success', async () => {
  // change displayName / avatarUrl and submit
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/settings/SettingsPage.test.tsx`
Expected: FAIL because form behavior does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
// add controlled form state for displayName/avatarUrl
// render save button and success/error feedback
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/settings/SettingsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings/SettingsPage.tsx src/pages/settings/SettingsPage.test.tsx
git commit -m "feat: add editable profile settings"
```

### Task 5: 为主题立即生效与失败回滚补失败测试

**Files:**
- Modify: `src/pages/settings/SettingsPage.test.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/app/theme/ThemeProvider.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('applies the selected theme immediately and persists it', async () => {
  // click dark, expect theme change and updateProfile call
});

it('rolls back the previous theme when persistence fails', async () => {
  // updateProfile rejects, expect theme restored
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/settings/SettingsPage.test.tsx`
Expected: FAIL because theme updates are not wired to app-level state.

- [ ] **Step 3: Write minimal implementation**

```tsx
// read/write theme mode from ThemeProvider
// optimistic apply + rollback on error
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/settings/SettingsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings/SettingsPage.tsx src/pages/settings/SettingsPage.test.tsx src/app/theme/ThemeProvider.tsx
git commit -m "feat: make settings theme changes live"
```

### Task 6: 为密码修改表单补失败测试

**Files:**
- Modify: `src/pages/settings/SettingsPage.test.tsx`
- Modify: `src/pages/settings/SettingsPage.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('blocks password submission when confirmation does not match', async () => {
  // submit mismatched password pair and expect validation message
});

it('updates the password and clears the form on success', async () => {
  // mock updatePassword success and assert fields reset
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/settings/SettingsPage.test.tsx`
Expected: FAIL because password form does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
// add new password / confirm password inputs
// validate before submit and call updatePassword
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/settings/SettingsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings/SettingsPage.tsx src/pages/settings/SettingsPage.test.tsx
git commit -m "feat: add password update to settings"
```

## Chunk 4: Final Verification

### Task 7: 运行最小回归验证

**Files:**
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `api/profile.ts`
- Test: `api/profile.test.ts`
- Test: `src/app/theme/ThemeProvider.test.tsx`
- Test: `src/pages/settings/SettingsPage.test.tsx`

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- api/profile.test.ts src/app/theme/ThemeProvider.test.tsx src/pages/settings/SettingsPage.test.tsx`
Expected: PASS

- [ ] **Step 2: Run type check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Smoke-check production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add api/profile.ts api/profile.test.ts src/app/providers.tsx src/app/theme src/pages/settings/SettingsPage.tsx src/pages/settings/SettingsPage.test.tsx
git commit -m "feat: complete settings mvp"
```

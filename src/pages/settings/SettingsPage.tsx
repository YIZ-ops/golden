import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { getProfile, updateProfile } from '@/services/api/profile';
import { ApiClientError } from '@/services/api/client';
import { clearSessionAndRedirect } from '@/services/supabase/session';
import type { UserProfile } from '@/types/user';

const THEME_OPTIONS: Array<{ value: 'light' | 'dark' | 'system'; label: string }> = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

export function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingTheme, setUpdatingTheme] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setError(null);
      return;
    }

    let active = true;
    setError(null);

    getProfile()
      .then((result) => {
        if (active) {
          setProfile(result.profile);
        }
      })
      .catch(async (requestError: unknown) => {
        if (!active) {
          return;
        }

        if (isUnauthorizedError(requestError)) {
          await clearSessionAndRedirect('/auth/login');
          return;
        }

        setError(requestError instanceof Error ? requestError.message : '获取资料失败。');
      });

    return () => {
      active = false;
    };
  }, [user]);

  async function handleThemeChange(themeMode: 'light' | 'dark' | 'system') {
    if (!user) {
      return;
    }

    setUpdatingTheme(themeMode);
    setError(null);

    try {
      const result = await updateProfile({ themeMode });
      setProfile(result.profile);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect('/auth/login');
        return;
      }

      setError(requestError instanceof Error ? requestError.message : '更新主题失败。');
    } finally {
      setUpdatingTheme(null);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (loading) {
    return (
      <PageCard eyebrow="Settings" title="设置">
        正在确认登录状态...
      </PageCard>
    );
  }

  if (!user) {
    return (
      <section className="space-y-4">
        <PageCard eyebrow="Settings" title="设置">
          当前未登录。登录后可同步收藏、感悟和主题偏好。
        </PageCard>

        <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Account</p>
          <h3 className="mt-3 font-serif text-2xl text-stone-900">账号入口</h3>
          <div className="mt-5 grid gap-3">
            <Link className="rounded-2xl bg-stone-900 px-4 py-3 text-center text-sm text-white" to="/auth/login">
              去登录
            </Link>
            <Link
              className="rounded-2xl border border-stone-200 px-4 py-3 text-center text-sm text-stone-700"
              to="/auth/register"
            >
              创建账号
            </Link>
            <Link className="text-sm text-stone-500 underline-offset-4 hover:underline" to="/auth/forgot-password">
              忘记密码
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <PageCard eyebrow="Settings" title="设置">管理账号、主题和同步偏好。</PageCard>

      <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Account</p>
        {profile ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                {(profile.displayName ?? profile.email ?? 'G').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-serif text-xl text-stone-900">{profile.displayName || '未命名用户'}</p>
                <p className="truncate text-sm text-stone-500">{profile.email}</p>
              </div>
            </div>
            <button
              className="rounded-2xl border border-stone-200 px-4 py-2 text-sm text-stone-700"
              onClick={handleSignOut}
              type="button"
            >
              退出登录
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">正在加载资料...</p>
        )}
      </div>

      <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Preference</p>
        <h3 className="mt-3 font-serif text-2xl text-stone-900">主题偏好</h3>
        <div className="mt-5 flex flex-wrap gap-3">
          {THEME_OPTIONS.map((option) => {
            const active = (profile?.themeMode ?? 'light') === option.value;
            return (
              <button
                key={option.value}
                aria-pressed={active}
                className={
                  active
                    ? 'rounded-full bg-stone-900 px-4 py-2 text-sm text-white'
                    : 'rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700'
                }
                disabled={Boolean(updatingTheme)}
                onClick={() => handleThemeChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
      </div>
    </section>
  );
}

function PageCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-400">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl text-stone-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">{children}</p>
    </div>
  );
}

function isUnauthorizedError(error: unknown) {
  return (
    (error instanceof ApiClientError && error.status === 401) ||
    (Boolean(error) &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: unknown }).status === 401)
  );
}

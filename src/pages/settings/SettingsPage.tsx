import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { ThemeMode, useTheme } from "@/app/theme/ThemeProvider";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/services/api/client";
import { getProfile, updateProfile } from "@/services/api/profile";
import { clearSessionAndRedirect } from "@/services/supabase/session";
import type { UserProfile } from "@/types/user";

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "跟随系统" },
];

type SettingsDrawerKey = "profile" | "theme" | "security" | null;

export function SettingsPage() {
  const { user, loading, signOut, updatePassword } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameBaseline, setNicknameBaseline] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [updatingTheme, setUpdatingTheme] = useState<ThemeMode | null>(null);
  const [passwordDraft, setPasswordDraft] = useState({ password: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<SettingsDrawerKey>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setNicknameDraft("");
      setNicknameBaseline("");
      setProfileError(null);
      setThemeError(null);
      setPasswordError(null);
      setThemeMode("system");
      setActiveDrawer(null);
      return;
    }

    let active = true;
    setProfileError(null);

    getProfile()
      .then((result) => {
        if (!active) {
          return;
        }

        const nextNickname = result.profile.displayName ?? "";
        setProfile(result.profile);
        setNicknameDraft(nextNickname);
        setNicknameBaseline(nextNickname);
        setThemeMode(result.profile.themeMode ?? "system");
        setAvatarFailed(false);
      })
      .catch(async (requestError: unknown) => {
        if (!active) {
          return;
        }

        if (isUnauthorizedError(requestError)) {
          await clearSessionAndRedirect("/auth/login");
          return;
        }

        setProfileError(requestError instanceof Error ? requestError.message : "获取资料失败。");
      });

    return () => {
      active = false;
    };
  }, [user, setThemeMode]);

  useEffect(() => {
    if (!activeDrawer) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeDrawer]);

  function openDrawer(drawer: Exclude<SettingsDrawerKey, null>) {
    setActiveDrawer(drawer);
    setProfileError(null);
    setThemeError(null);
    setPasswordError(null);
  }

  function closeDrawer() {
    setActiveDrawer(null);
    setProfileError(null);
    setThemeError(null);
    setPasswordError(null);
    setNicknameDraft(nicknameBaseline);
    setPasswordDraft({ password: "", confirmPassword: "" });
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const nextNickname = nicknameDraft.trim();

    if (nextNickname === nicknameBaseline) {
      closeDrawer();
      return;
    }

    setSavingProfile(true);
    setProfileError(null);

    try {
      const result = await updateProfile({ displayName: nextNickname });
      const savedNickname = result.profile.displayName ?? "";

      setProfile(result.profile);
      setNicknameDraft(savedNickname);
      setNicknameBaseline(savedNickname);
      setActiveDrawer(null);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setProfileError(requestError instanceof Error ? requestError.message : "保存资料失败。");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleThemeChange(nextThemeMode: ThemeMode) {
    if (!user) {
      return;
    }

    const previousThemeMode = profile?.themeMode ?? themeMode;
    setUpdatingTheme(nextThemeMode);
    setThemeError(null);
    setThemeMode(nextThemeMode);
    setProfile((currentProfile) => (currentProfile ? { ...currentProfile, themeMode: nextThemeMode } : currentProfile));

    try {
      const result = await updateProfile({ themeMode: nextThemeMode });
      setProfile(result.profile);
      setThemeMode(result.profile.themeMode ?? "system");
      setActiveDrawer(null);
    } catch (requestError) {
      setThemeMode(previousThemeMode);
      setProfile((currentProfile) =>
        currentProfile ? { ...currentProfile, themeMode: previousThemeMode } : currentProfile,
      );

      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setThemeError(requestError instanceof Error ? requestError.message : "更新主题失败。");
    } finally {
      setUpdatingTheme(null);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);

    if (!passwordDraft.password) {
      setPasswordError("请输入新密码");
      return;
    }

    if (passwordDraft.password.length < 6) {
      setPasswordError("新密码至少需要 6 位");
      return;
    }

    if (passwordDraft.password !== passwordDraft.confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }

    try {
      setSubmittingPassword(true);
      await updatePassword(passwordDraft.password);
      setPasswordDraft({ password: "", confirmPassword: "" });
      setActiveDrawer(null);
    } catch (submitError) {
      setPasswordError(submitError instanceof Error ? submitError.message : "密码更新失败，请稍后重试。");
    } finally {
      setSubmittingPassword(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (loading) {
    return <LoadingScreen label="正在确认登录状态..." />;
  }

  if (!user) {
    return (
      <section className="space-y-4">
        <IntroCopy>当前未登录。登录后可同步收藏、感悟和主题偏好。</IntroCopy>

        <div className="app-border border-t pt-4">
          <h3 className="app-text mt-3 font-serif text-2xl">账号入口</h3>
          <div className="mt-5 grid gap-3">
            <Link className="app-button-primary rounded-2xl px-4 py-3 text-center text-sm" to="/auth/login">
              去登录
            </Link>
            <Link className="app-button-secondary rounded-2xl px-4 py-3 text-center text-sm" to="/auth/register">
              创建账号
            </Link>
            <Link className="app-muted text-sm underline-offset-4 hover:underline" to="/auth/forgot-password">
              忘记密码
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const activeThemeMode = profile?.themeMode ?? themeMode;
  const avatarLetter = (profile?.displayName ?? profile?.email ?? "G").slice(0, 1).toUpperCase();
  const avatarUrl = profile?.avatarUrl?.trim() ?? "";

  return (
    <section className="space-y-5">
      <div className="app-border border-b pb-5">
        {profile ? (
          <div className="mt-1 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar avatarUrl={avatarUrl} fallback={avatarLetter} failed={avatarFailed} onError={() => setAvatarFailed(true)} />
              <div className="min-w-0">
                <p className="app-text truncate font-serif text-xl">{profile.displayName || "未命名用户"}</p>
                <p className="app-muted truncate text-sm">{profile.email}</p>
              </div>
            </div>
            <button
              className="app-button-secondary rounded-2xl px-4 py-2 text-sm"
              onClick={handleSignOut}
              type="button"
            >
              退出登录
            </button>
          </div>
        ) : (
          <LoadingScreen compact label="正在加载资料..." />
        )}
      </div>

      <div className="app-card overflow-hidden rounded-[1.75rem]">
        <SettingsListButton
          subtitle={profile?.displayName?.trim() || "未设置昵称"}
          title="个人资料"
          onClick={() => openDrawer("profile")}
        />
        <SettingsListButton
          subtitle={getThemeLabel(activeThemeMode)}
          title="主题偏好"
          onClick={() => openDrawer("theme")}
        />
        <SettingsListButton
          subtitle="修改登录密码"
          title="账号安全"
          onClick={() => openDrawer("security")}
        />
      </div>

      <SettingsDrawer open={activeDrawer === "profile"} title="个人资料" onClose={closeDrawer}>
        <form className="space-y-4" onSubmit={handleProfileSubmit}>
          <div className="space-y-2">
            <label className="app-text block text-sm font-medium" htmlFor="settings-display-name">
              昵称
            </label>
            <input
              id="settings-display-name"
              className="app-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
              onChange={(event) => setNicknameDraft(event.target.value)}
              type="text"
              value={nicknameDraft}
            />
          </div>
          {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
          <button
            className="app-button-primary w-full rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={savingProfile}
            type="submit"
          >
            {savingProfile ? "保存中..." : "保存"}
          </button>
        </form>
      </SettingsDrawer>

      <SettingsDrawer open={activeDrawer === "theme"} title="主题偏好" onClose={closeDrawer}>
        <div className="space-y-3">
          {THEME_OPTIONS.map((option) => {
            const active = activeThemeMode === option.value;
            return (
              <button
                key={option.value}
                aria-pressed={active}
                className={
                  active
                    ? "app-pill-active w-full rounded-2xl px-4 py-3 text-sm"
                    : "app-pill-inactive w-full rounded-2xl px-4 py-3 text-sm"
                }
                disabled={Boolean(updatingTheme)}
                onClick={() => handleThemeChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
          {themeError ? <p className="text-sm text-red-600">{themeError}</p> : null}
        </div>
      </SettingsDrawer>

      <SettingsDrawer open={activeDrawer === "security"} title="账号安全" onClose={closeDrawer}>
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <div className="space-y-2">
            <label className="app-text block text-sm font-medium" htmlFor="settings-password">
              新密码
            </label>
            <input
              id="settings-password"
              className="app-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
              onChange={(event) => setPasswordDraft((current) => ({ ...current, password: event.target.value }))}
              type="password"
              value={passwordDraft.password}
            />
          </div>
          <div className="space-y-2">
            <label className="app-text block text-sm font-medium" htmlFor="settings-confirm-password">
              确认新密码
            </label>
            <input
              id="settings-confirm-password"
              className="app-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
              onChange={(event) =>
                setPasswordDraft((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              type="password"
              value={passwordDraft.confirmPassword}
            />
          </div>
          {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
          <button
            className="app-button-primary w-full rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={loading || submittingPassword}
            type="submit"
          >
            {submittingPassword ? "保存中..." : "保存"}
          </button>
        </form>
      </SettingsDrawer>
    </section>
  );
}

function SettingsListButton({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      className="app-border flex w-full items-center justify-between gap-4 border-b px-5 py-4 text-left last:border-b-0"
      onClick={onClick}
      type="button"
    >
      <div className="min-w-0">
        <p className="app-text text-base font-medium">{title}</p>
        <p className="app-muted mt-1 truncate text-sm">{subtitle}</p>
      </div>
      <ChevronRight className="app-muted shrink-0" size={18} />
    </button>
  );
}

function SettingsDrawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-stone-950/35 backdrop-blur-sm"
      data-testid="settings-drawer-backdrop"
      onClick={onClose}
    >
      <div
        className="app-surface mx-auto w-full max-w-md rounded-t-3xl border px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-20px_50px_rgba(28,25,23,0.12)]"
        data-testid="settings-drawer-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="app-text font-serif text-xl">{title}</h3>
          <button className="app-muted text-sm" onClick={onClose} type="button">
            关闭
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar({
  avatarUrl,
  fallback,
  failed,
  onError,
}: {
  avatarUrl: string;
  fallback: string;
  failed: boolean;
  onError: () => void;
}) {
  if (avatarUrl && !failed) {
    return <img alt="用户头像" className="h-12 w-12 rounded-full object-cover" onError={onError} src={avatarUrl} />;
  }

  return (
    <div className="app-button-primary flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold">
      {fallback}
    </div>
  );
}

function getThemeLabel(themeMode: ThemeMode) {
  return THEME_OPTIONS.find((option) => option.value === themeMode)?.label ?? "跟随系统";
}

function IntroCopy({ children }: { children: string }) {
  return <p className="app-border app-muted border-b pb-4 text-sm leading-6">{children}</p>;
}

function isUnauthorizedError(error: unknown) {
  return (
    (error instanceof ApiClientError && error.status === 401) ||
    (Boolean(error) &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status?: unknown }).status === 401)
  );
}

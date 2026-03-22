import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PixelCat } from '@/components/PixelCat';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/pages/auth/AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = '请输入邮箱地址';
    }

    if (!password) {
      nextErrors.password = '请输入密码';
    }

    setFieldErrors(nextErrors);
    setError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      await signInWithPassword(email.trim(), password);
      navigate('/');
    } catch (submitError) {
      setError(getErrorMessage(submitError, '登录失败，请检查账号密码。'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="登录"
      description="使用账号密码登录，后续收藏、心动和感悟会通过 Supabase 账号体系同步。"
      footer={
        <div className="flex flex-col gap-2">
          <Link to="/auth/register" className="text-stone-900 underline underline-offset-4">
            没有账号？去注册
          </Link>
          <Link to="/auth/forgot-password" className="text-stone-900 underline underline-offset-4">
            忘记密码
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="邮箱" type="email" value={email} onChange={setEmail} error={fieldErrors.email} />
        <Field label="密码" type="password" value={password} onChange={setPassword} error={fieldErrors.password} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          aria-label="登录"
          type="submit"
          disabled={loading || submitting}
          className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <PixelCat ariaLabel="loading-cat" className="text-white" size={16} />
              <span>登录中...</span>
            </span>
          ) : (
            '登录'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  error,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const inputId = `auth-${label}`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-[#f8f4eb] px-4 py-3 outline-none transition focus:border-stone-400 focus:bg-[#fcf9f3]"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

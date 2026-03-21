import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/pages/auth/AuthLayout';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUpWithPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setSubmitting(true);
      await signUpWithPassword(email.trim(), password);
      setSuccess('注册成功，请使用刚创建的账号登录');
      navigate('/auth/login');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '注册失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="注册"
      description="创建一个账号，用于同步你的收藏、心动和感悟记录。"
      footer={
        <Link to="/auth/login" className="text-stone-900 underline underline-offset-4">
          已有账号？去登录
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="邮箱" type="email" value={email} onChange={setEmail} />
        <Field label="密码" type="password" value={password} onChange={setPassword} />
        <Field label="确认密码" type="password" value={confirmPassword} onChange={setConfirmPassword} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <button
          type="submit"
          disabled={loading || submitting}
          className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {submitting ? '注册中...' : '注册'}
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
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
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
        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 focus:bg-white"
      />
    </div>
  );
}

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PixelCat } from '@/components/PixelCat';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/pages/auth/AuthLayout';

export function ForgotPasswordPage() {
  const { sendResetPasswordEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
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

    try {
      setSubmitting(true);
      await sendResetPasswordEmail(email.trim());
      setSuccess('重置邮件已发送，请检查邮箱');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '发送失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="忘记密码"
      description="输入注册邮箱后，系统会发送一封密码重置邮件。"
      footer={
        <Link to="/auth/login" className="text-stone-900 underline underline-offset-4">
          返回登录
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="block text-sm font-medium text-stone-700">
            邮箱
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-[#f8f4eb] px-4 py-3 outline-none transition focus:border-stone-400 focus:bg-[#fcf9f3]"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <button
          aria-label="发送重置邮件"
          type="submit"
          disabled={loading || submitting}
          className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <PixelCat ariaLabel="loading-cat" className="text-white" size={16} />
              <span>发送中...</span>
            </span>
          ) : (
            '发送重置邮件'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

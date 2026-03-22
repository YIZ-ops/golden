import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { LoadingScreen } from '@/components/common/LoadingScreen';
import { PixelCat } from '@/components/PixelCat';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import { bootstrapRecoverySession } from '@/services/supabase/session';

type RecoveryStatus = 'checking' | 'ready' | 'expired';

export function ResetPasswordPage() {
  const { updatePassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<RecoveryStatus>('checking');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    bootstrapRecoverySession()
      .then((ready) => {
        if (!active) {
          return;
        }

        setStatus(ready ? 'ready' : 'expired');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setStatus('expired');
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!password) {
      setError('请输入新密码');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    try {
      setSubmitting(true);
      await updatePassword(password);
      setSuccess('密码已更新，请重新登录');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '密码更新失败，请重新获取重置链接。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="重置密码"
      description="通过邮件中的恢复链接进入后，可以在这里设置新密码。"
      footer={
        <Link to="/auth/login" className="text-stone-900 underline underline-offset-4">
          返回登录
        </Link>
      }
    >
      {status === 'checking' ? <LoadingScreen compact label="正在验证重置链接..." /> : null}

      {status === 'expired' ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">重置链接已失效或不存在</p>
          <Link to="/auth/forgot-password" className="text-sm text-stone-900 underline underline-offset-4">
            重新发送重置邮件
          </Link>
        </div>
      ) : null}

      {status === 'ready' ? (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="reset-password" className="block text-sm font-medium text-stone-700">
              新密码
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#f8f4eb] px-4 py-3 outline-none transition focus:border-stone-400 focus:bg-[#fcf9f3]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-stone-700">
              确认新密码
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#f8f4eb] px-4 py-3 outline-none transition focus:border-stone-400 focus:bg-[#fcf9f3]"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          <button
            aria-label="更新密码"
            type="submit"
            disabled={loading || submitting}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <PixelCat ariaLabel="loading-cat" className="text-white" size={16} />
                <span>更新中...</span>
              </span>
            ) : (
              '更新密码'
            )}
          </button>
        </form>
      ) : null}
    </AuthLayout>
  );
}

import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

const authState = {
  loading: false,
  user: null,
  session: null,
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
  updatePassword: vi.fn(),
  signOut: vi.fn(),
};

const sessionState = {
  bootstrapRecoverySession: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/services/supabase/session', () => ({
  bootstrapRecoverySession: (...args: unknown[]) => sessionState.bootstrapRecoverySession(...args),
}));

describe('Auth pages', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = null;
    authState.session = null;
    authState.signInWithPassword.mockReset();
    authState.signUpWithPassword.mockReset();
    authState.sendResetPasswordEmail.mockReset();
    authState.updatePassword.mockReset();
    authState.signOut.mockReset();
    sessionState.bootstrapRecoverySession.mockReset();
  });

  it('validates the login form before submit', async () => {
    renderPage(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByText('请输入邮箱地址')).toBeInTheDocument();
    expect(screen.getByText('请输入密码')).toBeInTheDocument();
    expect(authState.signInWithPassword).not.toHaveBeenCalled();
  });

  it('validates password confirmation on register', async () => {
    renderPage(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'hello@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password-123' } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'password-456' } });
    fireEvent.click(screen.getByRole('button', { name: '注册' }));

    expect(await screen.findByText('两次输入的密码不一致')).toBeInTheDocument();
    expect(authState.signUpWithPassword).not.toHaveBeenCalled();
  });

  it('shows a success state after sending the reset email', async () => {
    authState.sendResetPasswordEmail.mockResolvedValue(undefined);
    renderPage(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'hello@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '发送重置邮件' }));

    expect(authState.sendResetPasswordEmail).toHaveBeenCalledWith('hello@example.com');
    expect(await screen.findByText('重置邮件已发送，请检查邮箱')).toBeInTheDocument();
  });

  it('shows an expired state when recovery bootstrap fails', async () => {
    sessionState.bootstrapRecoverySession.mockResolvedValue(false);
    renderPage(<ResetPasswordPage />);

    expect(await screen.findByText('重置链接已失效或不存在')).toBeInTheDocument();
  });

  it('updates password after a valid recovery bootstrap', async () => {
    sessionState.bootstrapRecoverySession.mockResolvedValue(true);
    authState.updatePassword.mockResolvedValue(undefined);
    renderPage(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('新密码')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'new-password-123' } });
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'new-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: '更新密码' }));

    await waitFor(() => {
      expect(authState.updatePassword).toHaveBeenCalledWith('new-password-123');
    });
    expect(await screen.findByText('密码已更新，请重新登录')).toBeInTheDocument();
  });
});

function renderPage(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

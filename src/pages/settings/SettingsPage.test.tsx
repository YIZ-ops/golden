import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SettingsPage } from '@/pages/settings/SettingsPage';

const authState = {
  loading: false,
  user: null as null | { id: string; email?: string | null },
  session: null,
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
  updatePassword: vi.fn(),
  signOut: vi.fn(),
};

const profileApi = {
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
};

const sessionState = {
  clearSessionAndRedirect: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/services/api/profile', () => ({
  getProfile: () => profileApi.getProfile(),
  updateProfile: (...args: unknown[]) => profileApi.updateProfile(...args),
}));

vi.mock('@/services/supabase/session', () => ({
  clearSessionAndRedirect: (...args: unknown[]) => sessionState.clearSessionAndRedirect(...args),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = null;
    authState.signOut.mockReset();
    profileApi.getProfile.mockReset();
    profileApi.updateProfile.mockReset();
    sessionState.clearSessionAndRedirect.mockReset();
  });

  it('shows auth entry links when the user is anonymous', () => {
    renderPage(<SettingsPage />);

    expect(screen.getByRole('link', { name: '去登录' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '创建账号' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '忘记密码' })).toBeInTheDocument();
  });

  it('loads and renders the profile for signed-in users, then signs out', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    authState.signOut.mockResolvedValue(undefined);
    profileApi.getProfile.mockResolvedValue({
      profile: {
        id: 'user-1',
        email: 'hello@example.com',
        displayName: 'Golden User',
        avatarUrl: null,
        themeMode: 'light',
      },
    });

    renderPage(<SettingsPage />);

    expect(await screen.findByText('Golden User')).toBeInTheDocument();
    expect(screen.getByText('hello@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(authState.signOut).toHaveBeenCalled();
    });
  });

  it('redirects to login when profile request returns 401', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    profileApi.getProfile.mockRejectedValue({
      status: 401,
      message: 'expired',
    });

    renderPage(<SettingsPage />);

    await waitFor(() => {
      expect(sessionState.clearSessionAndRedirect).toHaveBeenCalledWith('/auth/login');
    });
  });
});

function renderPage(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

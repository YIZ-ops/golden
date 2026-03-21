import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { FavoritesPage } from '@/pages/favorites/FavoritesPage';

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

const favoritesApi = {
  getFavorites: vi.fn(),
};

const sessionState = {
  clearSessionAndRedirect: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/services/api/favorites', () => ({
  getFavorites: (...args: unknown[]) => favoritesApi.getFavorites(...args),
}));

vi.mock('@/services/supabase/session', () => ({
  clearSessionAndRedirect: (...args: unknown[]) => sessionState.clearSessionAndRedirect(...args),
}));

describe('FavoritesPage', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = null;
    favoritesApi.getFavorites.mockReset();
    sessionState.clearSessionAndRedirect.mockReset();
  });

  it('shows an auth gate when the user is anonymous', () => {
    renderPage(<FavoritesPage />);

    expect(screen.getByText('登录后即可同步你的收藏金句')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去登录' })).toBeInTheDocument();
  });

  it('loads favorites for signed-in users and supports list/gallery toggle', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    favoritesApi.getFavorites.mockResolvedValue({
      items: [
        {
          id: 'quote-1',
          content: '要有光。',
          author: '歌德',
          category: '哲理',
          viewerState: {
            isFavorited: true,
            viewerHeartbeatCount: 3,
          },
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    renderPage(<FavoritesPage />);

    expect(await screen.findByText('要有光。')).toBeInTheDocument();
    expect(screen.getByText('哲理')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '切换为列表视图' }));
    expect(screen.getByRole('button', { name: '切换为画廊视图' })).toBeInTheDocument();
  });

  it('redirects to login when favorites request returns 401', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    favoritesApi.getFavorites.mockRejectedValue({
      status: 401,
      message: 'expired',
    });

    renderPage(<FavoritesPage />);

    await waitFor(() => {
      expect(sessionState.clearSessionAndRedirect).toHaveBeenCalledWith('/auth/login');
    });
  });
});

function renderPage(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

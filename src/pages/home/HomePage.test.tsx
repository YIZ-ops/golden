import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HomePage } from '@/pages/home/HomePage';

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

const quotesApi = {
  getQuotes: vi.fn(),
  fetchHitokoto: vi.fn(),
};

const favoritesApi = {
  favoriteQuote: vi.fn(),
  unfavoriteQuote: vi.fn(),
};

const heartbeatsApi = {
  heartbeatQuote: vi.fn(),
};

const reflectionsApi = {
  getReflections: vi.fn(),
  createReflection: vi.fn(),
};

const exportState = {
  exportQuoteAsImage: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/services/api/quotes', () => ({
  getQuotes: (...args: unknown[]) => quotesApi.getQuotes(...args),
  fetchHitokoto: (...args: unknown[]) => quotesApi.fetchHitokoto(...args),
}));

vi.mock('@/services/api/favorites', () => ({
  favoriteQuote: (...args: unknown[]) => favoritesApi.favoriteQuote(...args),
  unfavoriteQuote: (...args: unknown[]) => favoritesApi.unfavoriteQuote(...args),
}));

vi.mock('@/services/api/heartbeats', () => ({
  heartbeatQuote: (...args: unknown[]) => heartbeatsApi.heartbeatQuote(...args),
}));

vi.mock('@/services/api/reflections', () => ({
  getReflections: (...args: unknown[]) => reflectionsApi.getReflections(...args),
  createReflection: (...args: unknown[]) => reflectionsApi.createReflection(...args),
}));

vi.mock('@/utils/export-image', () => ({
  exportQuoteAsImage: (...args: unknown[]) => exportState.exportQuoteAsImage(...args),
}));

describe('HomePage', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = null;
    quotesApi.getQuotes.mockReset();
    quotesApi.fetchHitokoto.mockReset();
    favoritesApi.favoriteQuote.mockReset();
    favoritesApi.unfavoriteQuote.mockReset();
    heartbeatsApi.heartbeatQuote.mockReset();
    reflectionsApi.getReflections.mockReset();
    reflectionsApi.createReflection.mockReset();
    exportState.exportQuoteAsImage.mockReset();

    quotesApi.getQuotes.mockResolvedValue({
      items: [
        {
          id: 'quote-1',
          content: '第一句，写给夜色。',
          author: '作者甲',
          source: '散文集',
          viewerState: {
            isFavorited: false,
            viewerHeartbeatCount: 0,
          },
        },
        {
          id: 'quote-2',
          content: '第二句，写给晨风。',
          author: '作者乙',
          source: '诗歌集',
          viewerState: {
            isFavorited: true,
            viewerHeartbeatCount: 2,
          },
        },
      ],
      page: 1,
      pageSize: 20,
      total: 2,
    });
    quotesApi.fetchHitokoto.mockResolvedValue({
      quote: {
        id: 'quote-3',
        content: '第三句，写给海面。',
        author: '作者丙',
        source: '一言',
      },
    });
    reflectionsApi.getReflections.mockResolvedValue({
      items: [
        {
          id: 'reflection-1',
          quoteId: 'quote-2',
          userId: 'user-1',
          content: '这一句让我停下来。',
          createdAt: '2026-03-21T10:00:00.000Z',
        },
      ],
    });
    reflectionsApi.createReflection.mockResolvedValue({
      reflection: {
        id: 'reflection-2',
        quoteId: 'quote-2',
        userId: 'user-1',
        content: '新的感悟',
        createdAt: '2026-03-21T11:00:00.000Z',
      },
    });
    favoritesApi.favoriteQuote.mockResolvedValue({ favorited: true });
    favoritesApi.unfavoriteQuote.mockResolvedValue({ favorited: false });
    heartbeatsApi.heartbeatQuote.mockResolvedValue({ quoteId: 'quote-2', count: 3 });
    exportState.exportQuoteAsImage.mockResolvedValue(undefined);
  });

  it('loads the first quote and keeps a vertical quote stream', async () => {
    renderPage();

    expect(await screen.findByText('第一句，写给夜色。')).toBeInTheDocument();
    expect(screen.getByText('第二句，写给晨风。')).toBeInTheDocument();
    expect(quotesApi.getQuotes).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it('switches current quote on scroll and uses actions against the active card', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    renderPage();

    await screen.findByText('第二句，写给晨风。');
    const stream = screen.getByTestId('quote-stream');

    Object.defineProperty(stream, 'clientHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(stream, 'scrollTop', {
      configurable: true,
      value: 600,
    });

    fireEvent.scroll(stream);
    fireEvent.click(screen.getByRole('button', { name: '收藏当前金句' }));
    fireEvent.click(screen.getByRole('button', { name: '心动当前金句' }));

    await waitFor(() => {
      expect(favoritesApi.unfavoriteQuote).toHaveBeenCalledWith('quote-2');
      expect(heartbeatsApi.heartbeatQuote).toHaveBeenCalledWith('quote-2');
    });
  });

  it('shows an inline auth gate instead of redirecting for protected actions', async () => {
    renderPage();

    await screen.findByText('第一句，写给夜色。');
    fireEvent.click(screen.getByRole('button', { name: '收藏当前金句' }));

    expect(await screen.findByText('登录后才能收藏、心动或记录感悟。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去登录' })).toBeInTheDocument();
  });

  it('fetches the next quote and appends it into the stream', async () => {
    renderPage();

    await screen.findByText('第一句，写给夜色。');
    fireEvent.click(screen.getByRole('button', { name: '获取下一句' }));

    await waitFor(() => {
      expect(quotesApi.fetchHitokoto).toHaveBeenCalled();
    });
    expect(await screen.findByText('第三句，写给海面。')).toBeInTheDocument();
  });

  it('loads and submits reflections for the active quote', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    renderPage();

    await screen.findByText('第二句，写给晨风。');
    const stream = screen.getByTestId('quote-stream');

    Object.defineProperty(stream, 'clientHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(stream, 'scrollTop', {
      configurable: true,
      value: 600,
    });

    fireEvent.scroll(stream);
    fireEvent.click(screen.getByRole('button', { name: '打开感悟面板' }));

    await waitFor(() => {
      expect(reflectionsApi.getReflections).toHaveBeenCalledWith('quote-2');
    });
    expect(await screen.findByText('这一句让我停下来。')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('新增感悟'), {
      target: { value: '新的感悟' },
    });
    fireEvent.click(screen.getByRole('button', { name: '提交感悟' }));

    await waitFor(() => {
      expect(reflectionsApi.createReflection).toHaveBeenCalledWith({
        quoteId: 'quote-2',
        content: '新的感悟',
      });
    });
    expect(await screen.findByText('新的感悟')).toBeInTheDocument();
  });

  it('updates the current card style and exports the active card', async () => {
    renderPage();

    await screen.findByText('第一句，写给夜色。');
    fireEvent.click(screen.getByRole('button', { name: '打开样式面板' }));
    fireEvent.change(screen.getByLabelText('字号大小'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: '导出当前金句' }));

    const activeCard = screen.getByTestId('active-quote-card');
    expect(activeCard).toHaveStyle({ fontSize: '30px' });
    await waitFor(() => {
      expect(exportState.exportQuoteAsImage).toHaveBeenCalled();
    });
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

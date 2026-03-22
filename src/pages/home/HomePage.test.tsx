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

const initialQuote = {
  id: 'quote-3',
  content: '第三句，写给海面。',
  author: '作者丙',
  source: '一言',
};

const nextQuote = {
  id: 'quote-2',
  content: '第二句，写给晨风。',
  author: '作者乙',
  source: '诗歌集',
};

const duplicateQuote = {
  id: 'quote-3',
  content: '第三句，写给海面。',
  author: '作者丙',
  source: '一言',
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
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    quotesApi.fetchHitokoto.mockResolvedValue({ quote: initialQuote });
    reflectionsApi.getReflections.mockResolvedValue({
      items: [
        {
          id: 'reflection-1',
          quoteId: nextQuote.id,
          userId: 'user-1',
          content: '这一句让我停下来。',
          createdAt: '2026-03-21T10:00:00.000Z',
        },
      ],
    });
    reflectionsApi.createReflection.mockResolvedValue({
      reflection: {
        id: 'reflection-2',
        quoteId: nextQuote.id,
        userId: 'user-1',
        content: '新的感悟',
        createdAt: '2026-03-21T11:00:00.000Z',
      },
    });
    favoritesApi.favoriteQuote.mockResolvedValue({ favorited: true });
    favoritesApi.unfavoriteQuote.mockResolvedValue({ favorited: false });
    heartbeatsApi.heartbeatQuote.mockResolvedValue({ quoteId: nextQuote.id, count: 3 });
    exportState.exportQuoteAsImage.mockResolvedValue(undefined);
  });

  it('loads the first quote from hitokoto and does not call getQuotes', async () => {
    renderPage();

    expect(await screen.findByText(initialQuote.content)).toBeInTheDocument();
    expect(quotesApi.fetchHitokoto).toHaveBeenCalledTimes(1);
    expect(quotesApi.getQuotes).not.toHaveBeenCalled();
  });

  it('does not render a next-quote button', async () => {
    renderPage();

    await screen.findByText(initialQuote.content);
    expect(screen.queryByRole('button', { name: '获取下一句' })).not.toBeInTheDocument();
  });

  it('renders the home page without a hero header', async () => {
    renderPage();

    await screen.findByText(initialQuote.content);
    expect(screen.queryByRole('heading', { name: '首页' })).not.toBeInTheDocument();
    expect(screen.queryByText('一句一句往下翻')).not.toBeInTheDocument();
  });

  it('prefetches another hitokoto when the reader reaches the end of the stream', async () => {
    quotesApi.fetchHitokoto
      .mockResolvedValueOnce({ quote: initialQuote })
      .mockResolvedValueOnce({ quote: nextQuote });

    renderPage();

    await screen.findByText(initialQuote.content);
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

    expect(await screen.findByText(nextQuote.content)).toBeInTheDocument();
    expect(quotesApi.fetchHitokoto).toHaveBeenCalledTimes(2);
  });

  it('retries when hitokoto returns a quote already shown in the current stream', async () => {
    quotesApi.fetchHitokoto
      .mockResolvedValueOnce({ quote: initialQuote })
      .mockResolvedValueOnce({ quote: duplicateQuote })
      .mockResolvedValueOnce({ quote: nextQuote });

    renderPage();

    await screen.findByText(initialQuote.content);
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

    expect(await screen.findByText(nextQuote.content)).toBeInTheDocument();
    expect(quotesApi.fetchHitokoto).toHaveBeenCalledTimes(3);
  });

  it('shows an inline auth gate instead of redirecting for protected actions', async () => {
    renderPage();

    await screen.findByText(initialQuote.content);
    fireEvent.click(screen.getByRole('button', { name: '收藏当前金句' }));

    expect(await screen.findByText('登录后才能收藏、心动或记录感悟。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去登录' })).toBeInTheDocument();
  });

  it('switches current quote on scroll and uses actions against the active card', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    quotesApi.fetchHitokoto
      .mockResolvedValueOnce({ quote: initialQuote })
      .mockResolvedValueOnce({ quote: nextQuote });

    renderPage();

    await scrollToEnd();
    fireEvent.click(screen.getByRole('button', { name: '收藏当前金句' }));
    fireEvent.click(screen.getByRole('button', { name: '心动当前金句' }));

    await waitFor(() => {
      expect(favoritesApi.favoriteQuote).toHaveBeenCalledWith(nextQuote.id);
      expect(heartbeatsApi.heartbeatQuote).toHaveBeenCalledWith(nextQuote.id);
    });
  });

  it('keeps the current stream readable when auto-prefetch fails', async () => {
    quotesApi.fetchHitokoto
      .mockResolvedValueOnce({ quote: initialQuote })
      .mockRejectedValueOnce(new Error('服务异常'));

    renderPage();

    await screen.findByText(initialQuote.content);
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

    expect(await screen.findByText(initialQuote.content)).toBeInTheDocument();
    expect(await screen.findByText('下一句获取失败，请稍后重试。')).toBeInTheDocument();
  });

  it('loads and submits reflections for the active quote', async () => {
    authState.user = { id: 'user-1', email: 'hello@example.com' };
    quotesApi.fetchHitokoto
      .mockResolvedValueOnce({ quote: initialQuote })
      .mockResolvedValueOnce({ quote: nextQuote });

    renderPage();

    await scrollToEnd();
    fireEvent.click(screen.getByRole('button', { name: '打开感悟面板' }));

    await waitFor(() => {
      expect(reflectionsApi.getReflections).toHaveBeenCalledWith(nextQuote.id);
    });
    expect(await screen.findByText('这一句让我停下来。')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('新增感悟'), {
      target: { value: '新的感悟' },
    });
    fireEvent.click(screen.getByRole('button', { name: '提交感悟' }));

    await waitFor(() => {
      expect(reflectionsApi.createReflection).toHaveBeenCalledWith({
        quoteId: nextQuote.id,
        content: '新的感悟',
      });
    });
    expect(await screen.findByText('新的感悟')).toBeInTheDocument();
  });

  it('updates the current card style and exports the active card', async () => {
    renderPage();

    await screen.findByText(initialQuote.content);
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

  it('renders a five-action toolbar without visible text labels', async () => {
    renderPage();

    await screen.findByText(initialQuote.content);
    expect(screen.getByRole('button', { name: '心动当前金句' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收藏当前金句' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开感悟面板' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开样式面板' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出当前金句' })).toBeInTheDocument();
    expect(screen.queryByText('心动')).not.toBeInTheDocument();
    expect(screen.queryByText('收藏')).not.toBeInTheDocument();
    expect(screen.queryByText('感悟')).not.toBeInTheDocument();
    expect(screen.queryByText('样式')).not.toBeInTheDocument();
    expect(screen.queryByText('导出')).not.toBeInTheDocument();
  });
});

async function scrollToEnd() {
  await screen.findByText(initialQuote.content);
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
  await screen.findByText(nextQuote.content);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { CategoriesPage } from '@/pages/categories/CategoriesPage';

const quotesApi = {
  getQuotes: vi.fn(),
  fetchHitokoto: vi.fn(),
};

vi.mock('@/services/api/quotes', () => ({
  getQuotes: (...args: unknown[]) => quotesApi.getQuotes(...args),
  fetchHitokoto: (...args: unknown[]) => quotesApi.fetchHitokoto(...args),
}));

describe('CategoriesPage', () => {
  beforeEach(() => {
    quotesApi.getQuotes.mockReset();
    quotesApi.fetchHitokoto.mockReset();
  });

  it('filters category, author, and singer entries via search', () => {
    renderPage(<CategoriesPage />);

    fireEvent.change(screen.getByLabelText('搜索分类、作者或歌手'), {
      target: { value: '周杰伦' },
    });

    expect(screen.getByRole('button', { name: '周杰伦' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '鲁迅' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '动画' })).not.toBeInTheDocument();
  });

  it('loads author quotes and renders the results', async () => {
    quotesApi.getQuotes.mockResolvedValue({
      items: [
        {
          id: 'quote-1',
          content: '人类的悲欢并不相通。',
          author: '鲁迅',
          category: '文学',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    renderPage(<CategoriesPage />);

    fireEvent.click(screen.getByRole('button', { name: '鲁迅' }));

    await waitFor(() => {
      expect(quotesApi.getQuotes).toHaveBeenCalledWith({
        authorRole: 'author',
        author: '鲁迅',
        page: 1,
        pageSize: 20,
      });
    });
    expect(await screen.findByText('人类的悲欢并不相通。')).toBeInTheDocument();
  });

  it('loads singer quotes and renders the results', async () => {
    quotesApi.getQuotes.mockResolvedValue({
      items: [
        {
          id: 'quote-2',
          content: '天青色等烟雨。',
          author: '周杰伦',
          category: '网易云',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    renderPage(<CategoriesPage />);

    fireEvent.click(screen.getByRole('button', { name: '周杰伦' }));

    await waitFor(() => {
      expect(quotesApi.getQuotes).toHaveBeenCalledWith({
        authorRole: 'singer',
        author: '周杰伦',
        page: 1,
        pageSize: 20,
      });
    });
    expect(await screen.findByText('天青色等烟雨。')).toBeInTheDocument();
  });

  it('fetches hitokoto by category and renders the returned quote', async () => {
    quotesApi.fetchHitokoto.mockResolvedValue({
      quote: {
        id: 'quote-3',
        content: '我用残损的手掌。',
        author: '佚名',
        category: '动画',
      },
    });

    renderPage(<CategoriesPage />);

    fireEvent.click(screen.getByRole('button', { name: '动画' }));

    await waitFor(() => {
      expect(quotesApi.fetchHitokoto).toHaveBeenCalledWith('a');
    });
    expect(await screen.findByText('我用残损的手掌。')).toBeInTheDocument();
  });

  it('shows an error state when quote request fails', async () => {
    quotesApi.getQuotes.mockRejectedValue(new Error('服务异常'));

    renderPage(<CategoriesPage />);

    fireEvent.click(screen.getByRole('button', { name: '鲁迅' }));

    expect(await screen.findByText('加载金句失败，请稍后重试。')).toBeInTheDocument();
  });
});

function renderPage(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

import { apiRequest } from '@/services/api/client';
import {
  fetchHitokoto,
  getQuotes,
} from '@/services/api/quotes';
import { getPeople } from '@/services/api/people';
import {
  favoriteQuote,
  getFavorites,
  unfavoriteQuote,
} from '@/services/api/favorites';
import { heartbeatQuote } from '@/services/api/heartbeats';
import { createReflection, getReflections } from '@/services/api/reflections';
import { getProfile, updateProfile } from '@/services/api/profile';

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
  ApiClientError: class extends Error {},
}));

describe('api service modules', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({});
  });

  it('maps getQuotes filters into query params', async () => {
    await getQuotes({
      category: '动画',
      authorRole: 'singer',
      author: '林俊杰',
      personId: 'person-1',
      keyword: '夜空',
      page: 2,
      pageSize: 12,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      '/api/quotes?category=%E5%8A%A8%E7%94%BB&authorRole=singer&author=%E6%9E%97%E4%BF%8A%E6%9D%B0&personId=person-1&keyword=%E5%A4%9C%E7%A9%BA&page=2&pageSize=12',
    );
  });

  it('maps getPeople filters into query params', async () => {
    await getPeople({
      role: 'author',
      keyword: '鲁',
      page: 1,
      pageSize: 4,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      '/api/people?role=author&keyword=%E9%B2%81&page=1&pageSize=4',
    );
  });

  it('maps favorites and heartbeats mutations to the expected endpoints', async () => {
    await getFavorites({ category: '生活', page: 1, pageSize: 10 });
    await favoriteQuote('quote-1');
    await unfavoriteQuote('quote-1');
    await heartbeatQuote('quote-1');

    expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/favorites?category=%E7%94%9F%E6%B4%BB&page=1&pageSize=10');
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/favorites/quote-1', { method: 'POST' });
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/api/favorites/quote-1', { method: 'DELETE' });
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/api/heartbeats/quote-1', { method: 'POST' });
  });

  it('maps reflections and profile payloads to the expected request bodies', async () => {
    await getReflections('quote-1');
    await createReflection({ quoteId: 'quote-1', content: '值得记住。' });
    await getProfile();
    await updateProfile({
      displayName: 'Golden User',
      avatarUrl: 'https://example.com/avatar.png',
      themeMode: 'dark',
    });
    await fetchHitokoto('a');

    expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/reflections?quoteId=quote-1');
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/reflections', {
      method: 'POST',
      body: {
        quoteId: 'quote-1',
        content: '值得记住。',
      },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/api/profile');
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/api/profile', {
      method: 'PATCH',
      body: {
        displayName: 'Golden User',
        avatarUrl: 'https://example.com/avatar.png',
        themeMode: 'dark',
      },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(5, '/api/quotes/fetch-hitokoto', {
      method: 'POST',
      body: {
        category: 'a',
      },
    });
  });
});

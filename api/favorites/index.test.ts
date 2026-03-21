import { beforeEach, describe, expect, it, vi } from 'vitest';

const favoritesBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
};

const userClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('../_lib/supabase', () => ({
  createUserServerClient: () => userClient,
}));

describe('GET /api/favorites', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    favoritesBuilder.select.mockReturnValue(favoritesBuilder);
    favoritesBuilder.eq.mockReturnValue(favoritesBuilder);
    favoritesBuilder.order.mockResolvedValue({
      data: [
        {
          quote_id: 'quote-1',
          created_at: '2026-03-21T00:00:00.000Z',
          quotes: {
            id: 'quote-1',
            content: '收藏金句 1',
            author: '鲁迅',
            category: '文学',
          },
        },
        {
          quote_id: 'quote-2',
          created_at: '2026-03-20T00:00:00.000Z',
          quotes: {
            id: 'quote-2',
            content: '收藏金句 2',
            author: '周杰伦',
            category: '网易云',
          },
        },
      ],
      error: null,
    });

    userClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
        },
      },
      error: null,
    });

    userClient.from.mockImplementation((table: string) => {
      if (table === 'favorites') {
        return favoritesBuilder;
      }

      if (table === 'heartbeats') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { quote_id: 'quote-1', count: 2 },
              { quote_id: 'quote-2', count: 1 },
            ],
            error: null,
          }),
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });
  });

  it('returns 401 when the route is unauthenticated', async () => {
    const { GET } = await import('./index');
    const response = await GET(new Request('https://example.com/api/favorites'));

    expect(response.status).toBe(401);
  });

  it('filters by category and paginates the response', async () => {
    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/favorites?category=文学&page=1&pageSize=1', {
        headers: {
          Authorization: `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`,
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      items: [
        {
          id: 'quote-1',
          content: '收藏金句 1',
          viewerState: {
            isFavorited: true,
            viewerHeartbeatCount: 2,
          },
        },
      ],
      page: 1,
      pageSize: 1,
      total: 1,
    });
  });
});

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

const anonSelectBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  ilike: vi.fn(),
  in: vi.fn(),
  range: vi.fn(),
  order: vi.fn(),
};

const userSelectBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  ilike: vi.fn(),
  in: vi.fn(),
  range: vi.fn(),
  order: vi.fn(),
};

const anonClient = {
  from: vi.fn(),
};

const userClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('../_lib/supabase', () => ({
  createAnonServerClient: () => anonClient,
  createUserServerClient: () => userClient,
}));

describe('GET /api/quotes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    configureBuilder(anonSelectBuilder, {
      data: [
        {
          id: 'quote-1',
          content: '匿名金句',
          author: '鲁迅',
          author_role: 'author',
          category: '文学',
        },
      ],
      count: 1,
    });

    configureBuilder(userSelectBuilder, {
      data: [
        {
          id: 'quote-1',
          content: '登录态金句',
          author: '周杰伦',
          author_role: 'singer',
          category: '网易云',
        },
      ],
      count: 1,
    });

    anonClient.from.mockReturnValue(anonSelectBuilder);
    userClient.from.mockImplementation((table: string) => {
      if (table === 'quotes') {
        return userSelectBuilder;
      }

      if (table === 'favorites') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ quote_id: 'quote-1' }],
            error: null,
          }),
        };
      }

      if (table === 'heartbeats') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ quote_id: 'quote-1', count: 3 }],
            error: null,
          }),
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });
    userClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'hello@example.com',
        },
      },
      error: null,
    });
  });

  it('returns 200 for an anonymous request', async () => {
    const { GET } = await import('./index');
    const response = await GET(new Request('https://example.com/api/quotes?page=1&pageSize=10'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      items: [
        {
          id: 'quote-1',
          content: '匿名金句',
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
    });
  });

  it('returns 401 before validation when an explicit token is invalid', async () => {
    userClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid jwt' },
    });

    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/quotes?page=0', {
        headers: {
          Authorization: 'Bearer header.payload.signature',
        },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });

  it('returns 400 for invalid pagination', async () => {
    const { GET } = await import('./index');
    const response = await GET(new Request('https://example.com/api/quotes?page=0&pageSize=10'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_PAGINATION',
    });
  });

  it('returns 400 for an invalid author role', async () => {
    const { GET } = await import('./index');
    const response = await GET(new Request('https://example.com/api/quotes?authorRole=actor'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_AUTHOR_ROLE',
    });
  });

  it('returns 400 for invalid author filters against the known option set', async () => {
    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/quotes?authorRole=singer&author=鲁迅'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_AUTHOR_FILTER',
    });
  });

  it('includes viewerState when the request is authenticated', async () => {
    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/quotes?authorRole=singer&author=周杰伦', {
        headers: {
          Authorization: `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`,
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items[0]).toMatchObject({
      viewerState: {
        isFavorited: true,
        viewerHeartbeatCount: 3,
      },
    });
  });
});

function configureBuilder(
  builder: typeof anonSelectBuilder,
  result: { data: unknown[]; count: number },
) {
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.ilike.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.range.mockResolvedValue({
    data: result.data,
    count: result.count,
    error: null,
  });
  builder.order.mockReturnValue(builder);
}

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

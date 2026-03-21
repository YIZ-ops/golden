import { beforeEach, describe, expect, it, vi } from 'vitest';

const userClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('../_lib/supabase', () => ({
  createUserServerClient: () => userClient,
}));

describe('reflection handlers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    userClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
        },
      },
      error: null,
    });
  });

  it('returns 401 for unauthenticated reflection reads', async () => {
    const { GET } = await import('./index');
    const response = await GET(new Request('https://example.com/api/reflections?quoteId=quote-1'));

    expect(response.status).toBe(401);
  });

  it('returns 400 when quoteId is missing', async () => {
    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/reflections', {
        headers: { Authorization: bearer() },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'MISSING_QUOTE_ID',
    });
  });

  it('returns only the current user reflections', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'reflection-1',
          quote_id: 'quote-1',
          user_id: 'user-1',
          content: '我的感悟',
          created_at: '2026-03-21T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const secondEq = vi.fn().mockReturnValue({ order });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    const select = vi.fn().mockReturnValue({ eq: firstEq });

    userClient.from.mockImplementation((table: string) => {
      if (table === 'reflections') {
        return { select };
      }

      throw new Error(`unexpected table: ${table}`);
    });

    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/reflections?quoteId=quote-1', {
        headers: { Authorization: bearer() },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [
        {
          id: 'reflection-1',
          quoteId: 'quote-1',
          content: '我的感悟',
        },
      ],
    });
  });

  it('returns 400 when creating a reflection without quoteId or content', async () => {
    const { POST } = await import('./index');
    const response = await POST(
      new Request('https://example.com/api/reflections', {
        method: 'POST',
        headers: {
          Authorization: bearer(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '' }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_REFLECTION_PAYLOAD',
    });
  });

  it('returns 404 when posting against a missing quote', async () => {
    userClient.from.mockImplementation((table: string) => {
      if (table === 'quotes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });

    const { POST } = await import('./index');
    const response = await POST(
      new Request('https://example.com/api/reflections', {
        method: 'POST',
        headers: {
          Authorization: bearer(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: 'missing-quote',
          content: '新的感悟',
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  it('returns the created reflection payload on success', async () => {
    userClient.from.mockImplementation((table: string) => {
      if (table === 'quotes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'quote-1' },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'reflections') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'reflection-2',
                  quote_id: 'quote-1',
                  user_id: 'user-1',
                  content: '新的感悟',
                  created_at: '2026-03-21T01:00:00.000Z',
                },
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });

    const { POST } = await import('./index');
    const response = await POST(
      new Request('https://example.com/api/reflections', {
        method: 'POST',
        headers: {
          Authorization: bearer(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: 'quote-1',
          content: '新的感悟',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reflection: {
        id: 'reflection-2',
        quoteId: 'quote-1',
        content: '新的感悟',
      },
    });
  });
});

function bearer() {
  return `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`;
}

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

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

describe('favorites mutation handlers', () => {
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

  it('returns 401 when the user is unauthenticated', async () => {
    const { POST } = await import('./[quoteId]');
    const response = await POST(new Request('https://example.com/api/favorites/quote-1', { method: 'POST' }));

    expect(response.status).toBe(401);
  });

  it('returns 404 when the quote does not exist', async () => {
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

    const { POST } = await import('./[quoteId]');
    const response = await POST(
      new Request('https://example.com/api/favorites/missing-quote', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`,
        },
      }),
    );

    expect(response.status).toBe(404);
  });

  it('creates favorites idempotently', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

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

      if (table === 'favorites') {
        return {
          upsert,
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });

    const { POST } = await import('./[quoteId]');
    const response = await POST(
      new Request('https://example.com/api/favorites/quote-1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      favorited: true,
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('deletes favorites idempotently', async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: null });
    const firstEq = vi.fn().mockReturnValue({
      eq: secondEq,
    });
    const deleteMock = vi.fn().mockReturnValue({
      eq: firstEq,
    });

    userClient.from.mockImplementation((table: string) => {
      if (table === 'favorites') {
        return {
          delete: deleteMock,
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });

    const { DELETE } = await import('./[quoteId]');
    const response = await DELETE(
      new Request('https://example.com/api/favorites/quote-1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      favorited: false,
    });
  });
});

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

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

describe('POST /api/heartbeats/:quoteId', () => {
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

  it('returns 401 when unauthenticated', async () => {
    const { POST } = await import('./[quoteId]');
    const response = await POST(new Request('https://example.com/api/heartbeats/quote-1', { method: 'POST' }));

    expect(response.status).toBe(401);
  });

  it('returns 404 when the quote is missing', async () => {
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
      new Request('https://example.com/api/heartbeats/missing-quote', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`,
        },
      }),
    );

    expect(response.status).toBe(404);
  });

  it('increments the heartbeat count by exactly one', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

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

      if (table === 'heartbeats') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'heartbeat-1',
                    count: 4,
                  },
                  error: null,
                }),
              }),
            }),
          }),
          update,
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });

    const { POST } = await import('./[quoteId]');
    const response = await POST(
      new Request('https://example.com/api/heartbeats/quote-1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${createJwt({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}`,
        },
      }),
    );

    expect(update).toHaveBeenCalledWith({
      count: 5,
      last_liked_at: expect.any(String),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      quoteId: 'quote-1',
      count: 5,
    });
  });
});

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

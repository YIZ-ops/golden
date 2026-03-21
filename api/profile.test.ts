import { beforeEach, describe, expect, it, vi } from 'vitest';

const userClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('./_lib/supabase', () => ({
  createUserServerClient: () => userClient,
}));

describe('profile handlers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    userClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'hello@example.com',
          user_metadata: {
            full_name: 'Golden User',
          },
        },
      },
      error: null,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    const { GET } = await import('./profile');
    const response = await GET(new Request('https://example.com/api/profile'));

    expect(response.status).toBe(401);
  });

  it('bootstraps the profile on first read and wraps the response', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: 'user-1',
          email: 'hello@example.com',
          display_name: 'Golden User',
          avatar_url: null,
          theme_mode: 'light',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: 'user-1',
          email: 'hello@example.com',
          display_name: 'Golden User',
          avatar_url: null,
          theme_mode: 'light',
        },
        error: null,
      });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });

    userClient.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          upsert,
          select,
        };
      }

      throw new Error(`unexpected table: ${table}`);
    });

    const { GET } = await import('./profile');
    const response1 = await GET(
      new Request('https://example.com/api/profile', {
        headers: { Authorization: bearer() },
      }),
    );
    const response2 = await GET(
      new Request('https://example.com/api/profile', {
        headers: { Authorization: bearer() },
      }),
    );

    expect(response1.status).toBe(200);
    await expect(response1.json()).resolves.toMatchObject({
      profile: {
        id: 'user-1',
        email: 'hello@example.com',
        displayName: 'Golden User',
        themeMode: 'light',
      },
    });

    expect(response2.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('returns 400 for invalid patch payload', async () => {
    const { PATCH } = await import('./profile');
    const response = await PATCH(
      new Request('https://example.com/api/profile', {
        method: 'PATCH',
        headers: {
          Authorization: bearer(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeMode: 'blue',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_PROFILE_PATCH',
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

import { getAccessToken } from '@/services/supabase/session';

import { ApiClientError, apiRequest } from '@/services/api/client';

vi.mock('@/services/supabase/session', () => ({
  getAccessToken: vi.fn(),
  clearSessionAndRedirect: vi.fn(),
}));

describe('apiRequest', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches bearer token when session exists', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('token-123');
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiRequest('/api/profile');

    expect(fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      }),
    );
  });

  it('omits authorization header when there is no session token', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiRequest('/api/quotes');

    expect(fetch).toHaveBeenCalledWith(
      '/api/quotes',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    );
  });

  it('serializes json body payloads', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('token-123');
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiRequest('/api/reflections', {
      method: 'POST',
      body: {
        quoteId: 'quote-1',
        content: 'hello',
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/reflections',
      expect.objectContaining({
        body: JSON.stringify({
          quoteId: 'quote-1',
          content: 'hello',
        }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('throws a structured api error for 401 responses', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('token-123');
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          message: '当前登录凭证无效，请重新登录。',
          code: 'INVALID_TOKEN',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(apiRequest('/api/profile')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_TOKEN',
      message: '当前登录凭证无效，请重新登录。',
    });
  });
});

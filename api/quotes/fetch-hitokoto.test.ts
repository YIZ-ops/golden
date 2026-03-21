import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('POST /api/quotes/fetch-hitokoto', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a normalized quote payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          uuid: 'hitokoto-1',
          hitokoto: '一言内容',
          from_who: '佚名',
          from: '测试来源',
          type: 'a',
        }),
      }),
    );

    const { POST } = await import('./fetch-hitokoto');
    const response = await POST(
      new Request('https://example.com/api/quotes/fetch-hitokoto', {
        method: 'POST',
        body: JSON.stringify({ category: 'a' }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      quote: {
        id: 'hitokoto-1',
        content: '一言内容',
        category: '动画',
        sourceType: 'hitokoto',
      },
    });
  });

  it('returns 400 for an invalid category', async () => {
    const { POST } = await import('./fetch-hitokoto');
    const response = await POST(
      new Request('https://example.com/api/quotes/fetch-hitokoto', {
        method: 'POST',
        body: JSON.stringify({ category: 'z' }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_HITOKOTO_CATEGORY',
    });
  });

  it('returns 502 when the upstream request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    const { POST } = await import('./fetch-hitokoto');
    const response = await POST(
      new Request('https://example.com/api/quotes/fetch-hitokoto', {
        method: 'POST',
        body: JSON.stringify({ category: 'a' }),
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: 'HITOKOTO_UPSTREAM_FAILED',
    });
  });

  it('does not write quotes when proxying hitokoto', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        uuid: 'hitokoto-1',
        hitokoto: '一言内容',
        from_who: '佚名',
        from: '测试来源',
        type: 'a',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('./fetch-hitokoto');
    await POST(
      new Request('https://example.com/api/quotes/fetch-hitokoto', {
        method: 'POST',
        body: JSON.stringify({ category: 'a' }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('https://v1.hitokoto.cn/');
  });
});

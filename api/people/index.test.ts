import { beforeEach, describe, expect, it, vi } from 'vitest';

const peopleSelectBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  ilike: vi.fn(),
  range: vi.fn(),
  order: vi.fn(),
};

const quotesSelectBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
};

const anonClient = {
  from: vi.fn(),
};

vi.mock('../_lib/supabase', () => ({
  createAnonServerClient: () => anonClient,
}));

describe('GET /api/people', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    peopleSelectBuilder.select.mockReturnValue(peopleSelectBuilder);
    peopleSelectBuilder.eq.mockReturnValue(peopleSelectBuilder);
    peopleSelectBuilder.ilike.mockReturnValue(peopleSelectBuilder);
    peopleSelectBuilder.order.mockReturnValue(peopleSelectBuilder);
    peopleSelectBuilder.range.mockResolvedValue({
      data: [
        {
          id: 'person-1',
          name: '鲁迅',
          role: 'author',
        },
        {
          id: 'person-2',
          name: '老舍',
          role: 'author',
        },
      ],
      count: 2,
      error: null,
    });

    quotesSelectBuilder.select.mockResolvedValue({
      data: [
        { person_id: 'person-1' },
        { person_id: 'person-1' },
        { person_id: 'person-2' },
      ],
      error: null,
    });
    quotesSelectBuilder.eq.mockReturnValue(quotesSelectBuilder);
    quotesSelectBuilder.in.mockReturnValue(quotesSelectBuilder);

    anonClient.from.mockImplementation((table: string) => {
      if (table === 'people') {
        return peopleSelectBuilder;
      }

      if (table === 'quotes') {
        return quotesSelectBuilder;
      }

      throw new Error(`unexpected table: ${table}`);
    });
  });

  it('returns people ordered by quote count for a valid role filter', async () => {
    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/people?role=author&page=1&pageSize=4'),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      items: [
        {
          id: 'person-1',
          name: '鲁迅',
          role: 'author',
          quoteCount: 2,
        },
        {
          id: 'person-2',
          name: '老舍',
          role: 'author',
          quoteCount: 1,
        },
      ],
      page: 1,
      pageSize: 4,
      total: 2,
    });
  }, 30000);

  it('returns 400 for an invalid role', async () => {
    const { GET } = await import('./index');
    const response = await GET(
      new Request('https://example.com/api/people?role=actor&page=1&pageSize=4'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_PERSON_ROLE',
    });
  }, 30000);
});

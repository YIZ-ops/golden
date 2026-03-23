import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/services/supabase/session", () => ({
  getAccessToken: vi.fn(),
}));

describe("quotes api cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reuses getQuotes result within ttl for same token and query", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { getAccessToken } = await import("@/services/supabase/session");
    const { getQuotes } = await import("@/services/api/quotes");
    const mockApiRequest = vi.mocked(apiRequest);
    const mockGetAccessToken = vi.mocked(getAccessToken);

    mockGetAccessToken.mockResolvedValue("token-1");
    mockApiRequest.mockResolvedValue({
      items: [
        {
          id: "q-1",
          content: "hello",
          author: "tester",
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });

    const first = await getQuotes({ personId: "p-1", page: 1, pageSize: 20 });
    const second = await getQuotes({ personId: "p-1", page: 1, pageSize: 20 });

    expect(first).toEqual(second);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  it("invalidates getQuotes cache after updateQuote", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { getAccessToken } = await import("@/services/supabase/session");
    const { getQuotes, updateQuote } = await import("@/services/api/quotes");
    const mockApiRequest = vi.mocked(apiRequest);
    const mockGetAccessToken = vi.mocked(getAccessToken);

    mockGetAccessToken.mockResolvedValue("token-1");
    mockApiRequest
      .mockResolvedValueOnce({
        items: [
          {
            id: "q-1",
            content: "before",
            author: "tester",
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        quote: {
          id: "q-1",
          content: "after",
          author: "tester",
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "q-1",
            content: "after",
            author: "tester",
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });

    await getQuotes({ category: "动漫", page: 1, pageSize: 20 });
    await updateQuote({ quoteId: "q-1", content: "after", author: "tester" });
    await getQuotes({ category: "动漫", page: 1, pageSize: 20 });

    expect(mockApiRequest).toHaveBeenCalledTimes(3);
  });
});

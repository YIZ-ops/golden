import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("reflections api cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reuses reflections request within ttl window", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { getReflections } = await import("@/services/api/reflections");
    const mockApiRequest = vi.mocked(apiRequest);

    mockApiRequest.mockResolvedValue({
      items: [
        {
          id: "r-1",
          quoteId: "q-1",
          userId: "u-1",
          content: "test",
        },
      ],
    });

    const first = await getReflections("q-1");
    const second = await getReflections("q-1");

    expect(first).toEqual(second);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  it("invalidates quote reflections cache after create", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { createReflection, getReflections } = await import("@/services/api/reflections");
    const mockApiRequest = vi.mocked(apiRequest);

    mockApiRequest
      .mockResolvedValueOnce({
        items: [
          {
            id: "r-1",
            quoteId: "q-1",
            userId: "u-1",
            content: "test",
          },
        ],
      })
      .mockResolvedValueOnce({
        reflection: {
          id: "r-2",
          quoteId: "q-1",
          userId: "u-1",
          content: "new",
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "r-1",
            quoteId: "q-1",
            userId: "u-1",
            content: "test",
          },
          {
            id: "r-2",
            quoteId: "q-1",
            userId: "u-1",
            content: "new",
          },
        ],
      });

    await getReflections("q-1");
    await createReflection({ quoteId: "q-1", content: "new" });
    await getReflections("q-1");

    expect(mockApiRequest).toHaveBeenCalledTimes(3);
  });
});

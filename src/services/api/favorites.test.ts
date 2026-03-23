import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("favorites api cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reuses the favorite folders request within the ttl window", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { getFavoriteFolders } = await import("@/services/api/favorites");
    const mockApiRequest = vi.mocked(apiRequest);

    mockApiRequest.mockResolvedValue({
      items: [{ id: "folder-1", isDefault: false, name: "我的收藏", quoteCount: 1 }],
    });

    const first = await getFavoriteFolders();
    const second = await getFavoriteFolders();

    expect(first).toEqual(second);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  it("invalidates the favorite folders cache after creating a folder", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { createFavoriteFolder, getFavoriteFolders } = await import("@/services/api/favorites");
    const mockApiRequest = vi.mocked(apiRequest);

    mockApiRequest
      .mockResolvedValueOnce({
        items: [{ id: "folder-1", isDefault: false, name: "我的收藏", quoteCount: 1 }],
      })
      .mockResolvedValueOnce({
        item: { id: "folder-2", isDefault: false, name: "新收藏夹", quoteCount: 0 },
      })
      .mockResolvedValueOnce({
        items: [
          { id: "folder-1", isDefault: false, name: "我的收藏", quoteCount: 1 },
          { id: "folder-2", isDefault: false, name: "新收藏夹", quoteCount: 0 },
        ],
      });

    await getFavoriteFolders();
    await createFavoriteFolder("新收藏夹");
    await getFavoriteFolders();

    expect(mockApiRequest).toHaveBeenCalledTimes(3);
  });

  it("reuses favorite folder quotes request within ttl window", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { getFavoriteFolderQuotes } = await import("@/services/api/favorites");
    const mockApiRequest = vi.mocked(apiRequest);

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

    const first = await getFavoriteFolderQuotes({ folderId: "folder-1", page: 1, pageSize: 20 });
    const second = await getFavoriteFolderQuotes({ folderId: "folder-1", page: 1, pageSize: 20 });

    expect(first).toEqual(second);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  it("invalidates favorite folder quotes cache after favoriting", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { favoriteQuote, getFavoriteFolderQuotes } = await import("@/services/api/favorites");
    const mockApiRequest = vi.mocked(apiRequest);

    mockApiRequest
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({ favorited: true })
      .mockResolvedValueOnce({
        items: [
          {
            id: "q-1",
            content: "hello",
            author: "tester",
          },
          {
            id: "q-2",
            content: "world",
            author: "tester",
          },
        ],
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      });

    await getFavoriteFolderQuotes({ folderId: "folder-1", page: 1, pageSize: 20 });
    await favoriteQuote("q-2", "folder-1");
    await getFavoriteFolderQuotes({ folderId: "folder-1", page: 1, pageSize: 20 });

    expect(mockApiRequest).toHaveBeenCalledTimes(3);
  });
});

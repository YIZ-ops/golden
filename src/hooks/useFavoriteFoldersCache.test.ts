import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFavoriteFoldersCache } from "./useFavoriteFoldersCache";

// Mock the API
vi.mock("@/services/api/favorites", () => ({
  getFavoriteFolders: vi.fn(),
}));

import { getFavoriteFolders } from "@/services/api/favorites";

describe("useFavoriteFoldersCache", () => {
  it("should cache folders and not refetch for 5 minutes", async () => {
    const mockFolders = [
      { id: "1", name: "Folder 1", quoteCount: 5 },
      { id: "2", name: "Folder 2", quoteCount: 3 },
    ];

    vi.mocked(getFavoriteFolders).mockResolvedValue({ items: mockFolders });

    const { result, rerender } = renderHook(() => useFavoriteFoldersCache("user-1"));

    // First render - should load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.folders).toEqual(mockFolders);
    expect(vi.mocked(getFavoriteFolders)).toHaveBeenCalledTimes(1);

    // Re-render without forcing refresh
    rerender();

    // Should not make another request
    expect(vi.mocked(getFavoriteFolders)).toHaveBeenCalledTimes(1);
  });

  it("should refresh folders when refresh is called", async () => {
    const mockFolders = [{ id: "1", name: "Folder 1", quoteCount: 5 }];
    const updatedFolders = [
      { id: "1", name: "Folder 1", quoteCount: 6 },
      { id: "2", name: "Folder 2", quoteCount: 3 },
    ];

    vi.mocked(getFavoriteFolders).mockResolvedValueOnce({ items: mockFolders }).mockResolvedValueOnce({ items: updatedFolders });

    const { result } = renderHook(() => useFavoriteFoldersCache("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.folders).toEqual(mockFolders);
    const initialCallCount = vi.mocked(getFavoriteFolders).mock.calls.length;

    // Manually refresh
    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.folders).toEqual(updatedFolders);
    });

    // Should have made one more request
    expect(vi.mocked(getFavoriteFolders).mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("should clear folders when user is undefined", async () => {
    const { result } = renderHook(() => useFavoriteFoldersCache(undefined));

    expect(result.current.folders).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

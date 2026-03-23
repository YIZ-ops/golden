import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { usePeopleCache, clearAllPeopleCache } from "./usePeopleCache";

// Mock the API
vi.mock("@/services/api/people", () => ({
  getPeople: vi.fn(),
}));

import { getPeople } from "@/services/api/people";

describe("usePeopleCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllPeopleCache();
  });

  it("should cache authors and not refetch for 5 minutes", async () => {
    const mockAuthors = [
      { id: "1", name: "Author 1", role: "author" as const },
      { id: "2", name: "Author 2", role: "author" as const },
    ];

    vi.mocked(getPeople).mockResolvedValue({ items: mockAuthors });

    const { result, rerender } = renderHook(() =>
      usePeopleCache({ role: "author", keyword: "", page: 1, pageSize: 20 })
    );

    // First render - should load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.people).toEqual(mockAuthors);
    expect(vi.mocked(getPeople)).toHaveBeenCalledTimes(1);

    // Re-render without forcing refresh
    rerender();

    // Should not make another request
    expect(vi.mocked(getPeople)).toHaveBeenCalledTimes(1);
  });

  it("should refresh people when refresh is called", async () => {
    const mockPeople = [{ id: "1", name: "Person 1", role: "author" as const }];
    const updatedPeople = [
      { id: "1", name: "Person 1", role: "author" as const },
      { id: "2", name: "Person 2", role: "author" as const },
    ];

    vi.mocked(getPeople)
      .mockResolvedValueOnce({ items: mockPeople })
      .mockResolvedValueOnce({ items: updatedPeople });

    const { result } = renderHook(() =>
      usePeopleCache({ role: "author", keyword: "", page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.people).toEqual(mockPeople);
    const initialCallCount = vi.mocked(getPeople).mock.calls.length;

    // Manually refresh
    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.people).toEqual(updatedPeople);
    });

    expect(vi.mocked(getPeople).mock.calls.length).toBeGreaterThan(
      initialCallCount
    );
  });

  it("should handle different keywords independently", async () => {
    const mockPeople1 = [{ id: "1", name: "Alice", role: "author" as const }];
    const mockPeople2 = [{ id: "2", name: "Bob", role: "author" as const }];

    vi.mocked(getPeople)
      .mockResolvedValueOnce({ items: mockPeople1 })
      .mockResolvedValueOnce({ items: mockPeople2 });

    // Query with keyword "Alice"
    const { result: result1 } = renderHook(() =>
      usePeopleCache({ role: "author", keyword: "Alice", page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    expect(result1.current.people).toEqual(mockPeople1);

    // Query with keyword "Bob"
    const { result: result2 } = renderHook(() =>
      usePeopleCache({ role: "author", keyword: "Bob", page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result2.current.loading).toBe(false);
    });

    expect(result2.current.people).toEqual(mockPeople2);
  });
});

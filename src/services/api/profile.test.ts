import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/services/supabase/session", () => ({
  getAccessToken: vi.fn(),
}));

describe("profile api cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reuses the profile request within ttl window for same token", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { getAccessToken } = await import("@/services/supabase/session");
    const { getProfile } = await import("@/services/api/profile");
    const mockApiRequest = vi.mocked(apiRequest);
    const mockGetAccessToken = vi.mocked(getAccessToken);

    mockGetAccessToken.mockResolvedValue("token-1");
    mockApiRequest.mockResolvedValue({
      profile: {
        id: "u-1",
        displayName: "tester",
        email: "test@example.com",
        avatarUrl: null,
        themeMode: "system",
      },
    });

    const first = await getProfile();
    const second = await getProfile();

    expect(first).toEqual(second);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  it("invalidates profile cache after update", async () => {
    const { apiRequest } = await import("@/services/api/client");
    const { getAccessToken } = await import("@/services/supabase/session");
    const { getProfile, updateProfile } = await import("@/services/api/profile");
    const mockApiRequest = vi.mocked(apiRequest);
    const mockGetAccessToken = vi.mocked(getAccessToken);

    mockGetAccessToken.mockResolvedValue("token-1");
    mockApiRequest
      .mockResolvedValueOnce({
        profile: {
          id: "u-1",
          displayName: "before",
          email: "test@example.com",
          avatarUrl: null,
          themeMode: "system",
        },
      })
      .mockResolvedValueOnce({
        profile: {
          id: "u-1",
          displayName: "after",
          email: "test@example.com",
          avatarUrl: null,
          themeMode: "dark",
        },
      })
      .mockResolvedValueOnce({
        profile: {
          id: "u-1",
          displayName: "after",
          email: "test@example.com",
          avatarUrl: null,
          themeMode: "dark",
        },
      });

    await getProfile();
    await updateProfile({ themeMode: "dark" });
    await getProfile();

    expect(mockApiRequest).toHaveBeenCalledTimes(3);
  });
});

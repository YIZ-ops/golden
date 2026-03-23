import { beforeEach, describe, expect, it, vi } from "vitest";

const requireBearerToken = vi.fn();
const isAuthFailure = vi.fn();
const createUnauthorizedErrorResponse = vi.fn();
const createUserServerClient = vi.fn();
const ensureProfile = vi.fn();

vi.mock("./_lib/auth.js", () => ({
  requireBearerToken,
  isAuthFailure,
  createUnauthorizedErrorResponse,
}));

vi.mock("./_lib/supabase.js", () => ({
  createUserServerClient,
}));

vi.mock("./_lib/profile.js", () => ({
  ensureProfile,
}));

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBearerToken.mockReturnValue("token");
    isAuthFailure.mockReturnValue(false);
    createUnauthorizedErrorResponse.mockImplementation(() => new Response(null, { status: 401 }));
    ensureProfile.mockResolvedValue({
      id: "user-1",
      email: "golden@example.com",
      display_name: "Golden",
      avatar_url: "https://example.com/avatar.png",
      theme_mode: "light",
    });
  });

  it("only updates fields present in the request body", async () => {
    const update = vi.fn(() => ({
      eq: () => ({
        select: () => ({
          maybeSingle: async () => ({
            data: {
              id: "user-1",
              email: "golden@example.com",
              display_name: "Moon",
              avatar_url: "https://example.com/avatar.png",
              theme_mode: "light",
            },
            error: null,
          }),
        }),
      }),
    }));

    createUserServerClient.mockReturnValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1", email: "golden@example.com" } }, error: null }),
      },
      from: () => ({
        update,
      }),
    });

    const { PATCH } = await import("./profile");
    await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Moon" }),
      }),
    );

    expect(update).toHaveBeenCalledWith({
      display_name: "Moon",
    });
  });

  it("treats empty strings as explicit clears for displayName and avatarUrl", async () => {
    const update = vi.fn(() => ({
      eq: () => ({
        select: () => ({
          maybeSingle: async () => ({
            data: {
              id: "user-1",
              email: "golden@example.com",
              display_name: null,
              avatar_url: null,
              theme_mode: "light",
            },
            error: null,
          }),
        }),
      }),
    }));

    createUserServerClient.mockReturnValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1", email: "golden@example.com" } }, error: null }),
      },
      from: () => ({
        update,
      }),
    });

    const { PATCH } = await import("./profile");
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "", avatarUrl: "" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      display_name: null,
      avatar_url: null,
    });
  });
});

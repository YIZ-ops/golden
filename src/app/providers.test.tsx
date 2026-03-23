import { render, waitFor } from "@testing-library/react";

import { AppProviders } from "@/app/providers";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/api/profile";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/api/profile", () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockGetProfile = vi.mocked(getProfile);

describe("AppProviders", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      loading: false,
      sendResetPasswordEmail: vi.fn(),
      session: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUpWithPassword: vi.fn(),
      updatePassword: vi.fn(),
      user: { id: "user-1" } as never,
    });

    mockGetProfile.mockResolvedValue({
      profile: {
        id: "user-1",
        email: "golden@example.com",
        displayName: "Golden",
        avatarUrl: null,
        themeMode: "dark",
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute("data-theme");
  });

  it("hydrates the saved profile theme for logged-in users", async () => {
    render(
      <AppProviders>
        <div>app</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalled();
      expect(document.documentElement.dataset.theme).toBe("dark");
    });
  });
});

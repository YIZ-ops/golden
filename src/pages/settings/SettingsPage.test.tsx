import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { ThemeProvider } from "@/app/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { getProfile, updateProfile } from "@/services/api/profile";
import { clearSessionAndRedirect } from "@/services/supabase/session";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/api/profile", () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("@/services/supabase/session", () => ({
  clearSessionAndRedirect: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockGetProfile = vi.mocked(getProfile);
const mockUpdateProfile = vi.mocked(updateProfile);
const mockClearSessionAndRedirect = vi.mocked(clearSessionAndRedirect);

function renderSettingsPage() {
  return render(
    <ThemeProvider initialMode="light">
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("SettingsPage", () => {
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
        avatarUrl: "https://example.com/avatar.png",
        themeMode: "light",
      },
    });

    mockUpdateProfile.mockResolvedValue({
      profile: {
        id: "user-1",
        email: "golden@example.com",
        displayName: "Golden",
        avatarUrl: "https://example.com/avatar.png",
        themeMode: "light",
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute("data-theme");
    document.body.style.overflow = "";
  });

  it("shows Chinese settings list items without inline forms", async () => {
    renderSettingsPage();

    expect(await screen.findByRole("button", { name: "个人资料 Golden" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "主题偏好 浅色" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "账号安全 修改登录密码" })).toBeInTheDocument();
    expect(screen.queryByLabelText("昵称")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("新密码")).not.toBeInTheDocument();
    expect(screen.queryByText("Account")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Preference")).not.toBeInTheDocument();
    expect(screen.queryByText("Security")).not.toBeInTheDocument();
    expect(screen.queryByText("头像地址")).not.toBeInTheDocument();
  });

  it("opens the profile drawer and updates nickname on success", async () => {
    const user = userEvent.setup();

    mockUpdateProfile.mockResolvedValueOnce({
      profile: {
        id: "user-1",
        email: "golden@example.com",
        displayName: "Moon",
        avatarUrl: "https://example.com/avatar.png",
        themeMode: "light",
      },
    });

    renderSettingsPage();

    await user.click(await screen.findByRole("button", { name: "个人资料 Golden" }));

    expect(screen.getByRole("heading", { name: "个人资料" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    const nameInput = screen.getByLabelText("昵称");
    await user.clear(nameInput);
    await user.type(nameInput, "Moon");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ displayName: "Moon" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "个人资料" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "个人资料 Moon" })).toBeInTheDocument();
  });

  it("applies the selected theme inside the drawer and closes on success", async () => {
    const user = userEvent.setup();

    mockUpdateProfile.mockResolvedValueOnce({
      profile: {
        id: "user-1",
        email: "golden@example.com",
        displayName: "Golden",
        avatarUrl: "https://example.com/avatar.png",
        themeMode: "dark",
      },
    });

    renderSettingsPage();

    await user.click(await screen.findByRole("button", { name: "主题偏好 浅色" }));

    const drawer = screen.getByTestId("settings-drawer-panel");
    await user.click(within(drawer).getByRole("button", { name: "深色" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ themeMode: "dark" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "主题偏好" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "主题偏好 深色" })).toBeInTheDocument();
  });

  it("keeps the theme drawer open and rolls back when persistence fails", async () => {
    const user = userEvent.setup();

    mockUpdateProfile.mockRejectedValueOnce(new Error("更新主题失败。"));

    renderSettingsPage();

    await user.click(await screen.findByRole("button", { name: "主题偏好 浅色" }));

    const drawer = screen.getByTestId("settings-drawer-panel");
    await user.click(within(drawer).getByRole("button", { name: "深色" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
    expect(screen.getByRole("heading", { name: "主题偏好" })).toBeInTheDocument();
    expect(screen.getByText("更新主题失败。")).toBeInTheDocument();
  });

  it("closes the drawer when clicking the backdrop", async () => {
    const user = userEvent.setup();

    renderSettingsPage();

    await user.click(await screen.findByRole("button", { name: "个人资料 Golden" }));
    expect(screen.getByRole("heading", { name: "个人资料" })).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-drawer-backdrop"));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "个人资料" })).not.toBeInTheDocument();
    });
  });

  it("blocks password submission when confirmation does not match", async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn();

    mockUseAuth.mockReturnValue({
      loading: false,
      sendResetPasswordEmail: vi.fn(),
      session: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUpWithPassword: vi.fn(),
      updatePassword,
      user: { id: "user-1" } as never,
    });

    renderSettingsPage();

    await user.click(await screen.findByRole("button", { name: "账号安全 修改登录密码" }));
    await user.type(screen.getByLabelText("新密码"), "123456");
    await user.type(screen.getByLabelText("确认新密码"), "654321");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByText("两次输入的新密码不一致")).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("updates the password and closes the security drawer on success", async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      loading: false,
      sendResetPasswordEmail: vi.fn(),
      session: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUpWithPassword: vi.fn(),
      updatePassword,
      user: { id: "user-1" } as never,
    });

    renderSettingsPage();

    await user.click(await screen.findByRole("button", { name: "账号安全 修改登录密码" }));
    await user.type(screen.getByLabelText("新密码"), "123456");
    await user.type(screen.getByLabelText("确认新密码"), "123456");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith("123456");
    });
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "账号安全" })).not.toBeInTheDocument();
    });
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { HomePage } from "@/pages/home/HomePage";
import { useAuth } from "@/hooks/useAuth";
import { getFavoriteFolders } from "@/services/api/favorites";
import { heartbeatQuote } from "@/services/api/heartbeats";
import { getHomeQuotes } from "@/services/api/quotes";
import { getReflections } from "@/services/api/reflections";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/api/quotes", () => ({
  getHomeQuotes: vi.fn(),
}));

vi.mock("@/services/api/favorites", () => ({
  favoriteQuote: vi.fn(),
  getFavoriteFolders: vi.fn(),
  unfavoriteQuote: vi.fn(),
}));

vi.mock("@/services/api/heartbeats", () => ({
  heartbeatQuote: vi.fn(),
}));

vi.mock("@/services/api/reflections", () => ({
  createReflection: vi.fn(),
  deleteReflection: vi.fn(),
  getReflections: vi.fn(),
}));

vi.mock("@/utils/export-image", () => ({
  exportQuoteAsImage: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockGetHomeQuotes = vi.mocked(getHomeQuotes);
const mockHeartbeatQuote = vi.mocked(heartbeatQuote);
const mockGetFavoriteFolders = vi.mocked(getFavoriteFolders);
const mockGetReflections = vi.mocked(getReflections);

describe("HomePage", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      loading: false,
      sendResetPasswordEmail: vi.fn(),
      session: null,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUpWithPassword: vi.fn(),
      updatePassword: vi.fn(),
      user: null,
    });

    mockGetHomeQuotes.mockResolvedValue({
      items: [
        {
          author: "作者乙",
          content: "随机句子",
          id: "quote-2",
          source: "作品乙",
        },
      ],
    });

    mockHeartbeatQuote.mockResolvedValue({
      count: 2,
      quoteId: "quote-2",
    });
    mockGetFavoriteFolders.mockResolvedValue({
      items: [{ id: "folder-1", isDefault: false, name: "默认收藏夹", quoteCount: 1 }],
    });
    mockGetReflections.mockResolvedValue({
      items: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the routed quote as the active home card and excludes it from the random fetch", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/",
            state: {
              focusQuote: {
                author: "作者甲",
                content: "焦点句子",
                id: "quote-1",
                source: "作品甲",
                viewerState: {
                  isFavorited: true,
                  viewerHeartbeatCount: 3,
                },
              },
            },
          },
        ]}
      >
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetHomeQuotes).toHaveBeenCalledWith(5, ["quote-1"]);
    });

    const activeCard = await screen.findByTestId("active-quote-card");
    expect(within(activeCard).getByText("焦点句子")).toBeInTheDocument();
    expect(screen.getByText("随机句子")).toBeInTheDocument();
  });

  it("keeps the stepped quote active while the programmatic scroll is still settling", async () => {
    let scrollLeftValue = 0;
    const user = userEvent.setup();

    mockGetHomeQuotes.mockResolvedValue({
      items: [
        { author: "作者甲", content: "第一句", id: "quote-1", source: "作品甲" },
        { author: "作者乙", content: "第二句", id: "quote-2", source: "作品乙" },
      ],
    });

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 320,
    });

    Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
      configurable: true,
      get() {
        return scrollLeftValue;
      },
      set(value: number) {
        scrollLeftValue = value;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: ({ left }: { left: number }) => {
        scrollLeftValue = left;
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await screen.findByText("第一句");

    await user.click(screen.getByRole("button", { name: "下一条金句" }));

    let activeCard = screen.getByTestId("active-quote-card");
    expect(within(activeCard).getByText("第二句")).toBeInTheDocument();

    scrollLeftValue = 0;
    fireEvent.scroll(screen.getByTestId("quote-stream"));

    activeCard = screen.getByTestId("active-quote-card");
    expect(within(activeCard).getByText("第二句")).toBeInTheDocument();
  });

  it("shows the heartbeat count and keeps a light active style after repeated clicks", async () => {
    const user = userEvent.setup();

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

    mockGetHomeQuotes.mockResolvedValue({
      items: [
        {
          author: "作者乙",
          content: "随机句子",
          id: "quote-2",
          source: "作品乙",
          viewerState: {
            isFavorited: false,
            viewerHeartbeatCount: 1,
          },
        },
      ],
    });

    mockHeartbeatQuote
      .mockResolvedValueOnce({ count: 2, quoteId: "quote-2" })
      .mockResolvedValueOnce({ count: 3, quoteId: "quote-2" });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await screen.findByText("随机句子");

    const heartbeatButton = screen.getByRole("button", { name: "心动当前金句" });
    await user.click(heartbeatButton);
    await user.click(heartbeatButton);

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(mockHeartbeatQuote).toHaveBeenCalledTimes(2);
    expect(heartbeatButton.className).not.toContain("bg-stone-900/88");
  });

  it("closes the favorite picker and reflection panel when clicking their backdrops", async () => {
    const user = userEvent.setup();

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

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await screen.findByText("随机句子");

    await user.click(screen.getByRole("button", { name: "收藏当前金句" }));
    expect(await screen.findByRole("heading", { name: "选择收藏夹" })).toBeInTheDocument();
    await user.click(screen.getByTestId("favorite-picker-backdrop"));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "选择收藏夹" })).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "打开感悟面板" }));
    expect(await screen.findByRole("heading", { name: "感悟记录" })).toBeInTheDocument();
    await user.click(screen.getByTestId("reflection-panel-backdrop"));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "感悟记录" })).not.toBeInTheDocument();
    });
  });

  it("does not show the removed pull-to-refresh hint", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await screen.findByText("随机句子");

    expect(screen.queryByText("下拉换一组")).not.toBeInTheDocument();
    expect(screen.queryByText("松手刷新")).not.toBeInTheDocument();
  });

  it("does not rely on oversized height compensation for the home container", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const page = await screen.findByTestId("home-quote-page");

    expect(page.className).toContain("flex-1");
    expect(page.className).toContain("min-h-0");
    expect(page.className).not.toContain("h-[calc(100%+6.75rem)]");
  });

  it("uses flex growth instead of percentage height for the home root container", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const page = await screen.findByTestId("home-quote-page");

    expect(page.className).toContain("flex-1");
    expect(page.className).toContain("min-h-0");
    expect(page.className).not.toContain("h-full");
  });
});

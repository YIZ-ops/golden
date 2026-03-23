import { act, render, screen } from "@testing-library/react";

import { ThemeProvider, useTheme } from "@/app/theme/ThemeProvider";

function ThemeProbe() {
  const { resolvedTheme } = useTheme();
  return <div>{resolvedTheme}</div>;
}

describe("ThemeProvider", () => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = false;

  beforeEach(() => {
    matches = false;
    listeners.clear();

    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      }),
      removeEventListener: vi.fn((_event, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      }),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme");
  });

  it("applies dark theme when mode is dark", () => {
    render(
      <ThemeProvider initialMode="dark">
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByText("dark")).toBeInTheDocument();
  });

  it("tracks system preference when mode is system", () => {
    render(
      <ThemeProvider initialMode="system">
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByText("light")).toBeInTheDocument();

    act(() => {
      matches = true;
      for (const listener of listeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByText("dark")).toBeInTheDocument();
  });
});

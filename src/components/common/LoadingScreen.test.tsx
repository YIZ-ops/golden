import { render, screen } from "@testing-library/react";

import { LoadingScreen } from "@/components/common/LoadingScreen";

describe("LoadingScreen", () => {
  it("uses theme-aware classes for the container and label", () => {
    render(<LoadingScreen label="页面加载中..." />);

    const status = screen.getByRole("status");
    const label = screen.getByText("页面加载中...");
    const icon = screen.getByLabelText("loading-cat");

    expect(status.className).toContain("app-muted");
    expect(label.className).toContain("app-text");
    expect(icon.getAttribute("class")).toContain("app-text");
  });
});

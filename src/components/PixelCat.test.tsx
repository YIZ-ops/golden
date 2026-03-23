import { render } from "@testing-library/react";

import { PixelCat } from "@/components/PixelCat";

describe("PixelCat", () => {
  it("uses theme variables for eye and pupil colors", () => {
    const { container } = render(<PixelCat />);

    expect(container.innerHTML).toContain('fill="var(--app-surface)"');
    expect(container.innerHTML).toContain('fill="var(--app-text)"');
  });
});

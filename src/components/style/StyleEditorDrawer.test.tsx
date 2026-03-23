import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { StyleEditorDrawer } from "@/components/style/StyleEditorDrawer";
import { DEFAULT_QUOTE_STYLE } from "@/constants/quote-style";

describe("StyleEditorDrawer", () => {
  it("shows a live preview and keeps the panel scrollable", async () => {
    const user = userEvent.setup();

    function Wrapper() {
      const [style, setStyle] = useState(DEFAULT_QUOTE_STYLE);

      return (
        <StyleEditorDrawer
          onChange={setStyle}
          onClose={vi.fn()}
          open
          previewQuote={{ author: "作者甲", content: "预览句子", source: "作品甲" }}
          stylePreset={style}
        />
      );
    }

    render(<Wrapper />);

    const panel = screen.getByTestId("style-editor-panel");
    expect(panel.className).toContain("overflow-y-auto");
    expect(screen.getByTestId("style-preview-card")).toHaveTextContent("预览句子");

    await user.click(screen.getByRole("button", { name: "中文黑体" }));
    await user.click(screen.getByRole("button", { name: "背景色 暖杏" }));

    expect(screen.getByTestId("style-preview-card")).toHaveStyle({
      background: "#f7ead9",
      fontFamily: "\"Noto Sans SC\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif",
    });
  });
});

import { render, screen } from "@testing-library/react";

import { QuoteCard } from "@/components/quote/QuoteCard";
import { DEFAULT_QUOTE_STYLE } from "@/constants/quote-style";

describe("QuoteCard", () => {
  it("does not reserve an oversized blank area at the bottom of the card", () => {
    render(
      <QuoteCard
        active
        quote={{ author: "作者甲", content: "测试句子", id: "quote-1", source: "作品甲" }}
        stylePreset={DEFAULT_QUOTE_STYLE}
      />,
    );

    expect(screen.getByTestId("active-quote-card")).toHaveStyle({
      paddingBottom: "80px",
    });
  });

  it("does not vertically center short quotes inside the card body", () => {
    render(
      <QuoteCard
        active
        quote={{ author: "作者甲", content: "测试句子", id: "quote-1", source: "作品甲" }}
        stylePreset={DEFAULT_QUOTE_STYLE}
      />,
    );

    expect(screen.getByText("测试句子").parentElement?.className).toContain("items-start");
    expect(screen.getByText("测试句子").parentElement?.className).not.toContain("items-center");
  });
});

import { forwardRef } from "react";

import { cn } from "@/utils/cn";
import { PixelCat } from "@/components/PixelCat";
import type { QuoteStyle } from "@/types/quote";

interface QuoteCardProps {
  quote: {
    id: string;
    content: string;
    author: string;
    source?: string;
  };
  stylePreset: QuoteStyle;
  active: boolean;
}

export const QuoteCard = forwardRef<HTMLDivElement, QuoteCardProps>(function QuoteCard({ quote, stylePreset, active }, ref) {
  const cardPadding = stylePreset.padding;
  const bottomSafePadding = 40;

  return (
    <article
      className={cn(
        "flex h-full min-w-full snap-center items-stretch justify-stretch px-5 pt-4 pb-4 transition-opacity duration-300",
        active ? "opacity-100" : "opacity-82",
      )}
    >
      <div
        ref={ref}
        data-testid={active ? "active-quote-card" : undefined}
        className={cn(
          "relative h-full w-full overflow-hidden border border-stone-200/70 shadow-[0_28px_64px_rgba(28,25,23,0.12)]",
          active ? "ring-1 ring-stone-300/60" : "",
        )}
        style={{
          background: stylePreset.background,
          paddingTop: `${cardPadding}px`,
          paddingRight: `${cardPadding}px`,
          paddingBottom: `${cardPadding + bottomSafePadding}px`,
          paddingLeft: `${cardPadding}px`,
          borderRadius: `${stylePreset.borderRadius}px`,
          color: stylePreset.color,
          fontFamily: stylePreset.fontFamily,
          fontSize: `${stylePreset.fontSize}px`,
          fontWeight: stylePreset.fontWeight,
          lineHeight: stylePreset.lineHeight,
          letterSpacing: `${stylePreset.letterSpacing}em`,
          textAlign: stylePreset.textAlign,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(28,25,23,0.06),transparent_40%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute left-6 top-2 font-display text-[9rem] leading-none text-current/10">
          “
        </span>
        <span aria-hidden="true" className="pointer-events-none absolute bottom-16 right-6 font-display text-[9rem] leading-none text-current/10">
          ”
        </span>
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 flex items-center justify-end text-[10px] uppercase tracking-[0.35em] opacity-50">
            <span className="text-right">{quote.source}</span>
          </div>
          <div className="flex flex-1 items-start justify-center pt-12">
            <p className="relative max-w-[18rem] text-[1.18em] leading-[1.72]">{quote.content}</p>
          </div>
          <div className="mt-8 flex items-center justify-between gap-3 text-sm opacity-70">
            <span className="h-px w-8 bg-current/30" />
            <span className="italic flex-1 text-center">{quote.author}</span>
            <span className="h-px w-8 bg-current/30" />
            {stylePreset.showLogo && (
              <div className="ml-2 opacity-50">
                <PixelCat size={20} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

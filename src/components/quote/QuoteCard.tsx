import { forwardRef } from 'react';

import { cn } from '@/utils/cn';
import type { QuoteStyle } from '@/types/quote';

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

export const QuoteCard = forwardRef<HTMLDivElement, QuoteCardProps>(function QuoteCard(
  { quote, stylePreset, active },
  ref,
) {
  const cardPadding = stylePreset.padding;

  return (
    <article
      className={cn(
        'flex min-h-[calc(100vh-12rem)] snap-start items-center justify-center py-2 transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-70',
      )}
    >
      <div
        ref={ref}
        data-testid={active ? 'active-quote-card' : undefined}
        className={cn(
          'relative h-full w-full overflow-hidden rounded-[2.5rem] border border-stone-200/70 shadow-[0_20px_50px_rgba(28,25,23,0.08)]',
          active ? 'ring-1 ring-stone-300/60' : '',
        )}
        style={{
          background: stylePreset.background,
          paddingTop: `${cardPadding}px`,
          paddingRight: `${cardPadding}px`,
          paddingBottom: `${cardPadding + 88}px`,
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(28,25,23,0.04),transparent_45%)]" />
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] opacity-50">
            <span>Golden Stream</span>
            <span>{quote.source || '手选金句'}</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <p className="font-serif leading-[1.7]">{quote.content}</p>
          </div>
          <div className="mt-8 flex items-center justify-center gap-3 text-sm opacity-70">
            <span className="h-px w-8 bg-current/30" />
            <span className="font-serif italic">— {quote.author}</span>
            <span className="h-px w-8 bg-current/30" />
          </div>
        </div>
      </div>
    </article>
  );
});

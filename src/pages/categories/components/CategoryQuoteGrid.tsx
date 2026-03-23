import { LoadingScreen } from "@/components/common/LoadingScreen";
import { EmptyState } from "@/components/common/EmptyState";
import type { QuoteListItem } from "@/services/api/quotes";
import type { Quote } from "@/types/quote";

interface CategoryQuoteGridProps {
  title: string;
  description: string;
  items: Array<QuoteListItem | Quote>;
  loading: boolean;
  error: string | null;
}

export function CategoryQuoteGrid({ title, description, items, loading, error }: CategoryQuoteGridProps) {
  return (
    <section className="border-t border-stone-200/70 pt-6">
      {title || description ? (
        <div className="mb-5">
          {title ? <h3 className="font-serif text-2xl text-stone-900">{title}</h3> : null}
          {description ? <p className="mt-2 text-sm text-stone-500">{description}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function LoadingState() {
  return <LoadingScreen compact label="结果加载中" />;
}

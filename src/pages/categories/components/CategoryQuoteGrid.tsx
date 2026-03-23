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
    <section className="app-border border-t pt-6">
      {title || description ? (
        <div className="mb-5">
          {title ? <h3 className="app-text font-serif text-2xl">{title}</h3> : null}
          {description ? <p className="app-muted mt-2 text-sm">{description}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function LoadingState() {
  return <LoadingScreen compact label="结果加载中" />;
}

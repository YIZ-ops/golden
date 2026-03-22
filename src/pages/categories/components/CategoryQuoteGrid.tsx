import { EmptyState } from '@/components/common/EmptyState';
import type { QuoteListItem } from '@/services/api/quotes';
import type { Quote } from '@/types/quote';

interface CategoryQuoteGridProps {
  title: string;
  description: string;
  items: Array<QuoteListItem | Quote>;
  loading: boolean;
  error: string | null;
}

export function CategoryQuoteGrid({ title, description, items, loading, error }: CategoryQuoteGridProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
      {title || description ? (
        <div className="mb-5">
          {title ? <h3 className="font-serif text-2xl text-stone-900">{title}</h3> : null}
          {description ? <p className="mt-2 text-sm text-stone-500">{description}</p> : null}
        </div>
      ) : null}

      <div>
        {loading ? <LoadingState /> : null}
        {!loading && error ? <EmptyState title="请求失败" description={error} /> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState title="还没开始找" description="先点一个分类、作者或歌手，下面就会接住结果。" />
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="grid gap-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
                <p className="font-serif text-lg leading-8 text-stone-900">{item.content}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span>{item.person?.name || item.author}</span>
                  <span>分类 {item.category || '未分类'}</span>
                  {item.work?.title ? <span>出处 {item.work.title}</span> : null}
                  {('viewerState' in item) && item.viewerState ? (
                    <span>心动 {item.viewerState.viewerHeartbeatCount}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-3" aria-label="结果加载中">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
          <div className="h-4 w-3/4 rounded bg-stone-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

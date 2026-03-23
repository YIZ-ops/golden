import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Heart } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { getQuotes, type GetQuotesParams, type QuoteListItem } from "@/services/api/quotes";
import type { PaginatedResponse } from "@/types/api";

const PAGE_SIZE = 20;

type QueryBaseParams = Omit<GetQuotesParams, "page" | "pageSize">;
type ExtendedQueryParams = QueryBaseParams & Record<string, string | number | undefined>;

interface QuoteInfiniteListProps {
  queryParams: ExtendedQueryParams | null;
  fetchPage?: (params: GetQuotesParams) => Promise<PaginatedResponse<QuoteListItem>>;
  invalidErrorMessage: string;
  requestErrorMessage: string;
  emptyDescription: string;
  emptyTitle?: string;
  listTitle?: string;
  initialLoadingLabel?: string;
  loadingMoreLabel?: string;
  onFirstPageLoaded?: (items: QuoteListItem[]) => void;
  onItemClick?: (item: QuoteListItem) => void;
  renderItemActions?: (item: QuoteListItem) => ReactNode;
  reloadKey?: string | number;
}

export function QuoteInfiniteList({
  queryParams,
  fetchPage,
  invalidErrorMessage,
  requestErrorMessage,
  emptyDescription,
  emptyTitle = "暂无数据",
  listTitle,
  initialLoadingLabel = "列表加载中",
  loadingMoreLabel = "正在加载更多",
  onFirstPageLoaded,
  onItemClick,
  renderItemActions,
  reloadKey,
}: QuoteInfiniteListProps) {
  const [items, setItems] = useState<QuoteListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const hasMore = items.length < total;

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      if (!queryParams) {
        setItems([]);
        setPage(1);
        setTotal(0);
        setError(invalidErrorMessage);
        return;
      }

      setInitialLoading(true);
      setError(null);
      setItems([]);
      setPage(1);
      setTotal(0);

      try {
        const response = await (fetchPage ?? getQuotes)({ ...queryParams, page: 1, pageSize: PAGE_SIZE });

        if (cancelled) {
          return;
        }

        setItems(response.items);
        setPage(response.page);
        setTotal(response.total);
        onFirstPageLoaded?.(response.items);
      } catch {
        if (cancelled) {
          return;
        }

        setItems([]);
        setError(requestErrorMessage);
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    void loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [fetchPage, invalidErrorMessage, onFirstPageLoaded, queryParams, requestErrorMessage, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!queryParams || initialLoading || loadingMore || !!error || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const response = await (fetchPage ?? getQuotes)({ ...queryParams, page: nextPage, pageSize: PAGE_SIZE });

      setItems((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const appended = response.items.filter((item) => !existing.has(item.id));
        return [...prev, ...appended];
      });
      setPage(response.page);
      setTotal(response.total);
    } catch {
      setError("继续加载失败，请稍后重试。");
    } finally {
      setLoadingMore(false);
    }
  }, [error, fetchPage, hasMore, initialLoading, loadingMore, page, queryParams]);

  useEffect(() => {
    const node = loaderRef.current;

    if (!node || !hasMore || initialLoading || loadingMore || !!error) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [error, hasMore, initialLoading, loadMore, loadingMore]);

  return (
    <>
      {listTitle ? <h2 className="text-center font-serif text-2xl text-stone-900">{listTitle}</h2> : null}

      {initialLoading ? <LoadingScreen compact label={initialLoadingLabel} /> : null}

      {!initialLoading && error ? <EmptyState title="请求失败" description={error} /> : null}

      {!initialLoading && !error && items.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}

      {!initialLoading && !error && items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-stone-200/80 bg-[#f8f4eb] p-3">
              {onItemClick ? (
                <div>
                  <button className="block w-full text-left" onClick={() => onItemClick(item)} type="button">
                    <p className="font-serif text-lg leading-8 text-stone-900">{item.content}</p>
                    <div className="mt-4 flex items-start justify-between gap-3 text-xs text-stone-500">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{item.person?.name || item.author}</span>
                        <span>{item.source || "未知"}</span>
                      </div>
                    </div>
                  </button>
                  {renderItemActions ? <div className="mt-3 flex justify-end gap-2">{renderItemActions(item)}</div> : null}
                </div>
              ) : (
                <div>
                  <p className="font-serif text-lg leading-8 text-stone-900">{item.content}</p>
                  <div className="mt-4 flex items-start justify-between gap-3 text-xs text-stone-500">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{item.person?.name || item.author}</span>
                      <span>{item.source || "未知"}</span>
                    </div>
                  </div>
                  {renderItemActions ? <div className="mt-3 flex justify-end gap-2">{renderItemActions(item)}</div> : null}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {!initialLoading && !error && hasMore ? (
        <>
          <div ref={loaderRef} className="h-1 w-full" aria-hidden="true" />
          {loadingMore ? <LoadingScreen compact label={loadingMoreLabel} /> : null}
        </>
      ) : null}

      {!initialLoading && !error && !hasMore && items.length > 0 ? <p className="py-2 text-center text-xs text-stone-400">已经到底了</p> : null}
    </>
  );
}

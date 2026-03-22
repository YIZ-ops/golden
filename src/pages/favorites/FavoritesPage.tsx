import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { StarBottle } from '@/components/StarBottle';
import { useAuth } from '@/hooks/useAuth';
import { ApiClientError } from '@/services/api/client';
import { getFavorites, type FavoriteQuote } from '@/services/api/favorites';
import { clearSessionAndRedirect } from '@/services/supabase/session';

type ViewMode = 'gallery' | 'list';

export function FavoritesPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<FavoriteQuote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  useEffect(() => {
    if (!user) {
      setItems([]);
      setError(null);
      return;
    }

    let active = true;
    setError(null);

    getFavorites({ page: 1, pageSize: 50 })
      .then((result) => {
        if (active) {
          setItems(result.items);
        }
      })
      .catch(async (requestError: unknown) => {
        if (!active) {
          return;
        }

        if (isUnauthorizedError(requestError)) {
          await clearSessionAndRedirect('/auth/login');
          return;
        }

        setError(requestError instanceof Error ? requestError.message : '获取收藏失败。');
      });

    return () => {
      active = false;
    };
  }, [user]);

  const categories = useMemo(() => {
    const values = new Set(items.map((item) => item.category || '未分类'));
    return ['全部', ...values];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === '全部') {
      return items;
    }

    return items.filter((item) => (item.category || '未分类') === selectedCategory);
  }, [items, selectedCategory]);

  if (loading) {
    return (
      <PageCard eyebrow="Favorites" title="收藏">
        正在确认登录状态...
      </PageCard>
    );
  }

  if (!user) {
    return (
      <section className="space-y-4">
        <PageCard eyebrow="Favorites" title="收藏">登录后即可把喜欢的句子留在收藏夹里。</PageCard>
        <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
          <Link className="rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white" to="/auth/login">
            去登录
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <PageCard eyebrow="Favorites" title="收藏">把反复想读的句子留在这里，按分类慢慢翻。</PageCard>

      <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Shelf</p>
            <h3 className="mt-3 font-serif text-2xl text-stone-900">收藏夹概览</h3>
            <p className="mt-2 text-sm text-stone-500">
              当前分类：{selectedCategory}，共 {filteredItems.length} 条。
            </p>
          </div>
          <StarBottle
            color="#f59e0b"
            count={filteredItems.length}
            isDarkMode={false}
            label={selectedCategory === '全部' ? '全部收藏' : selectedCategory}
            shape="vial"
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Library</p>
            <h3 className="mt-3 font-serif text-2xl text-stone-900">我的收藏</h3>
          </div>
          <button
            aria-label={viewMode === 'gallery' ? '切换为列表视图' : '切换为画廊视图'}
            className="rounded-2xl border border-stone-200 px-4 py-2 text-sm text-stone-700"
            onClick={() => setViewMode((current) => (current === 'gallery' ? 'list' : 'gallery'))}
            type="button"
          >
            {viewMode === 'gallery' ? '列表' : '画廊'}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                aria-pressed={active}
                className={
                  active
                    ? 'rounded-full bg-stone-900 px-3 py-1 text-xs text-white'
                    : 'rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600'
                }
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-5 text-sm text-red-500">{error}</p> : null}

        {!error && filteredItems.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">这个分类里还没有留下来的句子。</p>
        ) : null}

        <div className={viewMode === 'gallery' ? 'mt-6 grid gap-4' : 'mt-6 space-y-3'}>
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={
                viewMode === 'gallery'
                  ? 'rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5'
                  : 'flex items-center justify-between rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4'
              }
            >
              <div className="min-w-0">
                <p className="font-serif text-lg text-stone-900">{item.content}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span>{item.author}</span>
                  <span>分类 {item.category || '未分类'}</span>
                  <span>心动 {item.viewerState.viewerHeartbeatCount}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PageCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-400">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl text-stone-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">{children}</p>
    </div>
  );
}

function isUnauthorizedError(error: unknown) {
  return (
    (error instanceof ApiClientError && error.status === 401) ||
    (Boolean(error) &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: unknown }).status === 401)
  );
}

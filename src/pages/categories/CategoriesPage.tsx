import { useState } from 'react';

import { CategoryFilters } from '@/pages/categories/components/CategoryFilters';
import { CategoryQuoteGrid } from '@/pages/categories/components/CategoryQuoteGrid';
import { fetchHitokoto, getQuotes, type QuoteListItem } from '@/services/api/quotes';
import type { Quote } from '@/types/quote';

const PAGE_SIZE = 20;

export function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authorOffset, setAuthorOffset] = useState(0);
  const [singerOffset, setSingerOffset] = useState(0);
  const [items, setItems] = useState<Array<QuoteListItem | Quote>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsTitle, setResultsTitle] = useState('结果区');
  const [resultsDescription, setResultsDescription] = useState('点击上方入口后，在这里查看命中的金句。');

  async function handleCategorySelect(categoryId: string) {
    setLoading(true);
    setError(null);
    setResultsTitle('分类结果');
    setResultsDescription('已从一言接口获取一条新的金句。');

    try {
      const response = await fetchHitokoto(categoryId);
      setItems(response.quote ? [response.quote] : []);
    } catch {
      setItems([]);
      setError('加载金句失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthorSelect(author: string) {
    setLoading(true);
    setError(null);
    setResultsTitle(`作者：${author}`);
    setResultsDescription('以下结果来自当前作者的服务端查询。');

    try {
      const response = await getQuotes({
        authorRole: 'author',
        author,
        page: 1,
        pageSize: PAGE_SIZE,
      });
      setItems(response.items);
    } catch {
      setItems([]);
      setError('加载金句失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }

  async function handleSingerSelect(singer: string) {
    setLoading(true);
    setError(null);
    setResultsTitle(`歌手：${singer}`);
    setResultsDescription('以下结果来自当前歌手的服务端查询。');

    try {
      const response = await getQuotes({
        authorRole: 'singer',
        author: singer,
        page: 1,
        pageSize: PAGE_SIZE,
      });
      setItems(response.items);
    } catch {
      setItems([]);
      setError('加载金句失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Route</p>
        <h2 className="mt-3 font-serif text-3xl text-stone-900">分类</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          这里已经开始接管分类浏览、作者筛选、歌手筛选和结果展示，不再只是占位路由。
        </p>
      </div>

      <CategoryFilters
        authorOffset={authorOffset}
        loading={loading}
        onAuthorSelect={handleAuthorSelect}
        onCategorySelect={handleCategorySelect}
        onRotateAuthors={() => setAuthorOffset((value) => value + 4)}
        onRotateSingers={() => setSingerOffset((value) => value + 4)}
        onSearchChange={setSearchQuery}
        onSingerSelect={handleSingerSelect}
        searchQuery={searchQuery}
        singerOffset={singerOffset}
      />

      <CategoryQuoteGrid
        description={resultsDescription}
        error={error}
        items={items}
        loading={loading}
        title={resultsTitle}
      />
    </section>
  );
}

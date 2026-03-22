import { useEffect, useState } from 'react';

import { CategoryFilters } from '@/pages/categories/components/CategoryFilters';
import { CategoryQuoteGrid } from '@/pages/categories/components/CategoryQuoteGrid';
import { getPeople } from '@/services/api/people';
import { fetchHitokoto, getQuotes, type QuoteListItem } from '@/services/api/quotes';
import type { PersonListItem } from '@/types/person';
import type { Quote } from '@/types/quote';

const PAGE_SIZE = 20;

export function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authorOffset, setAuthorOffset] = useState(0);
  const [singerOffset, setSingerOffset] = useState(0);
  const [authors, setAuthors] = useState<PersonListItem[]>([]);
  const [singers, setSingers] = useState<PersonListItem[]>([]);
  const [items, setItems] = useState<Array<QuoteListItem | Quote>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsTitle, setResultsTitle] = useState('');
  const [resultsDescription, setResultsDescription] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      try {
        const [authorResponse, singerResponse] = await Promise.all([
          getPeople({ role: 'author', keyword: searchQuery, page: 1, pageSize: 20 }),
          getPeople({ role: 'singer', keyword: searchQuery, page: 1, pageSize: 20 }),
        ]);

        if (cancelled) {
          return;
        }

        setAuthors(authorResponse.items);
        setSingers(singerResponse.items);
      } catch {
        if (cancelled) {
          return;
        }

        setAuthors([]);
        setSingers([]);
      }
    }

    void loadPeople();

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

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

  async function handleAuthorSelect(author: PersonListItem) {
    setLoading(true);
    setError(null);
    setResultsTitle(`作者：${author.name}`);
    setResultsDescription('以下结果来自当前作者的服务端查询。');

    try {
      const response = await getQuotes({
        personId: author.id,
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

  async function handleSingerSelect(singer: PersonListItem) {
    setLoading(true);
    setError(null);
    setResultsTitle(`歌手：${singer.name}`);
    setResultsDescription('以下结果来自当前歌手的服务端查询。');

    try {
      const response = await getQuotes({
        personId: singer.id,
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
      <CategoryFilters
        authors={authors}
        authorOffset={authorOffset}
        loading={loading}
        onAuthorSelect={handleAuthorSelect}
        onCategorySelect={handleCategorySelect}
        onRotateAuthors={() => setAuthorOffset((value) => value + 4)}
        onRotateSingers={() => setSingerOffset((value) => value + 4)}
        onSearchChange={setSearchQuery}
        onSingerSelect={handleSingerSelect}
        searchQuery={searchQuery}
        singers={singers}
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

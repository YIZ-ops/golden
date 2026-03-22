import { useEffect, useRef, useState, type TouchEvent, type UIEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { QuoteActions } from '@/components/quote/QuoteActions';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { PixelCat } from '@/components/PixelCat';
import { QuoteCard } from '@/components/quote/QuoteCard';
import { ReflectionPanel } from '@/components/reflection/ReflectionPanel';
import { StyleEditorDrawer } from '@/components/style/StyleEditorDrawer';
import { DEFAULT_QUOTE_STYLE } from '@/constants/quote-style';
import { useAuth } from '@/hooks/useAuth';
import { favoriteQuote, unfavoriteQuote } from '@/services/api/favorites';
import { heartbeatQuote } from '@/services/api/heartbeats';
import {
  createReflection,
  getReflections,
  type ReflectionItem,
} from '@/services/api/reflections';
import { getHomeQuotes, type QuoteListItem } from '@/services/api/quotes';
import type { QuoteStyle } from '@/types/quote';
import { exportQuoteAsImage } from '@/utils/export-image';

type HomeQuote = QuoteListItem & {
  viewerState: {
    isFavorited: boolean;
    viewerHeartbeatCount: number;
  };
};

const QUOTE_STYLE_STORAGE_KEY = 'golden-home-quote-style';
const QUOTE_BUFFER_SIZE = 5;
const PULL_REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 96;

export function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<HomeQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [reflectionSubmitting, setReflectionSubmitting] = useState(false);
  const [reflections, setReflections] = useState<ReflectionItem[]>([]);
  const [reflectionDraft, setReflectionDraft] = useState('');
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_QUOTE_STYLE;
    }

    const raw = window.localStorage.getItem(QUOTE_STYLE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_QUOTE_STYLE;
    }

    try {
      return { ...DEFAULT_QUOTE_STYLE, ...(JSON.parse(raw) as Partial<QuoteStyle>) };
    } catch {
      return DEFAULT_QUOTE_STYLE;
    }
  });

  const streamRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loadQuoteBatch()
      .then((response) => {
        if (!active) {
          return;
        }

        const nextQuotes = response.items.map(toHomeQuote);

        if (nextQuotes.length === 0) {
          setError('首页金句加载失败，请稍后重试。');
          setLoading(false);
          return;
        }

        setQuotes(nextQuotes);
        setCurrentIndex(0);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('首页金句加载失败，请稍后重试。');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(QUOTE_STYLE_STORAGE_KEY, JSON.stringify(quoteStyle));
    }
  }, [quoteStyle]);

  useEffect(() => {
    syncStreamPosition(currentIndex);
  }, [currentIndex, quotes.length]);

  const currentQuote = quotes[currentIndex] ?? null;

  useEffect(() => {
    if (!reflectionOpen || !currentQuote || !user) {
      return;
    }

    let active = true;
    setReflectionsLoading(true);

    getReflections(currentQuote.id)
      .then((response) => {
        if (active) {
          setReflections(response.items);
        }
      })
      .finally(() => {
        if (active) {
          setReflectionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reflectionOpen, currentQuote, user]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const rawIndex = Math.round(container.scrollLeft / Math.max(container.clientWidth, 1));
    const nextIndex = Math.min(Math.max(rawIndex, 0), Math.max(quotes.length - 1, 0));

    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < quotes.length) {
      setCurrentIndex(nextIndex);
    }
  }

  function syncStreamPosition(index: number) {
    const container = streamRef.current;
    if (!container) {
      return;
    }

    const nextOffset = index * container.clientWidth;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ left: nextOffset, behavior: 'smooth' });
      return;
    }

    try {
      container.scrollLeft = nextOffset;
    } catch {
      // JSDOM tests may lock scrollLeft with a read-only descriptor.
    }
  }

  function handleStep(direction: -1 | 1) {
    if (quotes.length === 0) {
      return;
    }

    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), quotes.length - 1);
    if (nextIndex === currentIndex) {
      return;
    }

    setCurrentIndex(nextIndex);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    if (event.touches.length !== 1 || refreshing) {
      return;
    }

    touchStartYRef.current = event.touches[0].clientY;
    touchStartXRef.current = event.touches[0].clientX;
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    if (refreshing || touchStartYRef.current === null || touchStartXRef.current === null) {
      return;
    }

    const touch = event.touches[0];
    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaX = touch.clientX - touchStartXRef.current;

    if (deltaY <= 0 || deltaY <= Math.abs(deltaX)) {
      setPullDistance(0);
      return;
    }

    setPullDistance(Math.min(deltaY * 0.8, MAX_PULL_DISTANCE));
  }

  async function handleTouchEnd() {
    touchStartYRef.current = null;
    touchStartXRef.current = null;

    if (pullDistance < PULL_REFRESH_THRESHOLD || refreshing) {
      setPullDistance(0);
      return;
    }

    setPullDistance(0);
    await refreshQuoteBatch();
  }

  function handleTouchCancel() {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setPullDistance(0);
  }

  async function refreshQuoteBatch() {
    setRefreshing(true);
    setError(null);

    try {
      const response = await loadQuoteBatch(quotes.map((item) => item.id));
      const nextQuotes = response.items.map(toHomeQuote);

      if (nextQuotes.length === 0) {
        setError('暂时没有更多不同的金句了，请稍后再试。');
        return;
      }

      setQuotes(nextQuotes);
      setCurrentIndex(0);
    } catch {
      setError('刷新金句失败，请稍后重试。');
    } finally {
      setRefreshing(false);
    }
  }

  function loadQuoteBatch(excludeIds: string[] = []) {
    return excludeIds.length > 0
      ? getHomeQuotes(QUOTE_BUFFER_SIZE, excludeIds)
      : getHomeQuotes(QUOTE_BUFFER_SIZE);
  }

  async function handleFavorite() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt('登录后才能收藏、心动或记录感悟。');
      return;
    }

    try {
      const method = currentQuote.viewerState.isFavorited ? unfavoriteQuote : favoriteQuote;
      await method(currentQuote.id);

      setError(null);
      setQuotes((current) =>
        current.map((item, index) =>
          index === currentIndex
            ? {
                ...item,
                viewerState: {
                  ...item.viewerState,
                  isFavorited: !item.viewerState.isFavorited,
                },
              }
            : item,
        ),
      );
    } catch {
      setError('收藏操作失败，请稍后重试。');
    }
  }

  async function handleHeartbeat() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt('登录后才能收藏、心动或记录感悟。');
      return;
    }

    try {
      const response = await heartbeatQuote(currentQuote.id);
      const nextCount = normalizeHeartbeatCount(response);

      if (nextCount === null) {
        setError('记录心动失败，请稍后重试。');
        return;
      }

      setError(null);
      setQuotes((current) =>
        current.map((item, index) =>
          index === currentIndex
            ? {
                ...item,
                viewerState: {
                  ...item.viewerState,
                  viewerHeartbeatCount: nextCount,
                },
              }
            : item,
        ),
      );
    } catch {
      setError('记录心动失败，请稍后重试。');
    }
  }

  async function handleOpenReflections() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt('登录后才能收藏、心动或记录感悟。');
      return;
    }

    setLoginPrompt(null);
    setReflectionOpen(true);
  }

  async function handleCreateReflection() {
    if (!currentQuote || !reflectionDraft.trim() || !user || reflectionSubmitting) {
      return;
    }

    try {
      setReflectionSubmitting(true);
      const response = await createReflection({
        quoteId: currentQuote.id,
        content: reflectionDraft.trim(),
      });

      setReflections((current) => [...current, response.reflection]);
      setReflectionDraft('');
    } finally {
      setReflectionSubmitting(false);
    }
  }

  async function handleExport() {
    if (!activeCardRef.current || !currentQuote) {
      return;
    }

    await exportQuoteAsImage(activeCardRef.current, `golden-${currentQuote.id}.png`);
  }

  if (authLoading || loading) {
    return (
      <section className="relative -mx-6 -my-6 min-h-[calc(100vh-12rem)] overflow-hidden px-6 py-6">
        <LoadingScreen className="h-[calc(100vh-12rem)]" label="正在接住下一句。" />
      </section>
    );
  }

  return (
    <section
      className="relative -mx-6 -my-6 min-h-[calc(100vh-12rem)] overflow-hidden"
      data-testid="home-quote-page"
      onTouchCancel={handleTouchCancel}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
        style={{ transform: `translateY(${Math.max(pullDistance - 40, -36)}px)` }}
      >
        <div className="rounded-full border border-stone-200/60 bg-[#f6f2e8]/90 px-4 py-2 text-xs tracking-[0.18em] text-stone-600 shadow-sm backdrop-blur">
          {refreshing ? (
            <span aria-live="polite" className="flex items-center gap-2" role="status">
              <PixelCat ariaLabel="loading-cat" className="text-stone-500" size={14} />
              <span>正在换一组</span>
            </span>
          ) : pullDistance >= PULL_REFRESH_THRESHOLD ? (
            '松手刷新'
          ) : (
            '下拉换一组'
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex flex-col items-center gap-2 px-6">
        {loginPrompt ? (
          <div className="pointer-events-auto rounded-full border border-amber-200/60 bg-amber-50/78 px-4 py-2 text-sm text-amber-900 backdrop-blur">
            <p>{loginPrompt}</p>
            <Link className="ml-2 inline-block underline underline-offset-4" to="/auth/login">
              去登录
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="pointer-events-auto rounded-full border border-stone-300/50 bg-[#f3eee4]/92 px-4 py-2 text-sm text-stone-700 backdrop-blur">
            {error}
          </p>
        ) : null}
      </div>

      <div
        ref={streamRef}
        className="no-scrollbar flex h-[calc(100vh-12rem)] snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        data-testid="quote-stream"
        onScroll={handleScroll}
      >
        {quotes.map((quote, index) => (
          <QuoteCard
            key={quote.id}
            active={index === currentIndex}
            quote={quote}
            ref={index === currentIndex ? activeCardRef : null}
            stylePreset={quoteStyle}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-4">
        <button
          aria-label="上一条金句"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/45 bg-white/28 text-stone-700 shadow-[0_16px_32px_rgba(28,25,23,0.12)] backdrop-blur-xl transition hover:bg-white/45 disabled:cursor-default disabled:opacity-30"
          disabled={currentIndex === 0}
          onClick={() => handleStep(-1)}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="下一条金句"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/45 bg-white/28 text-stone-700 shadow-[0_16px_32px_rgba(28,25,23,0.12)] backdrop-blur-xl transition hover:bg-white/45 disabled:cursor-default disabled:opacity-30"
          disabled={currentIndex >= quotes.length - 1}
          onClick={() => handleStep(1)}
          type="button"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <QuoteActions
        heartbeatCount={currentQuote?.viewerState.viewerHeartbeatCount ?? 0}
        isFavorited={currentQuote?.viewerState.isFavorited ?? false}
        onExport={handleExport}
        onFavorite={handleFavorite}
        onHeartbeat={handleHeartbeat}
        onOpenReflections={handleOpenReflections}
        onOpenStyleEditor={() => setStyleOpen(true)}
      />
      <ReflectionPanel
        draft={reflectionDraft}
        items={reflections}
        loading={reflectionsLoading}
        onClose={() => setReflectionOpen(false)}
        onDraftChange={setReflectionDraft}
        onSubmit={handleCreateReflection}
        open={reflectionOpen}
        submitting={reflectionSubmitting}
      />

      <StyleEditorDrawer
        onChange={setQuoteStyle}
        onClose={() => setStyleOpen(false)}
        open={styleOpen}
        stylePreset={quoteStyle}
      />
    </section>
  );
}

function toHomeQuote(quote: QuoteListItem): HomeQuote {
  return {
    ...quote,
    viewerState: quote.viewerState ?? {
      isFavorited: false,
      viewerHeartbeatCount: 0,
    },
  };
}

function normalizeHeartbeatCount(response: unknown) {
  if (!response || typeof response !== 'object' || !('count' in response)) {
    return null;
  }

  const rawCount = (response as { count?: unknown }).count;
  const normalized =
    typeof rawCount === 'number'
      ? rawCount
      : typeof rawCount === 'string' && rawCount.trim() !== ''
        ? Number(rawCount)
        : Number.NaN;

  return Number.isFinite(normalized) ? normalized : null;
}

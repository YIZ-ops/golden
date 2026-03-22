import { useEffect, useRef, useState, type UIEvent } from 'react';
import { Link } from 'react-router-dom';

import { QuoteActions } from '@/components/quote/QuoteActions';
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
import { fetchHitokoto, type QuoteListItem } from '@/services/api/quotes';
import type { QuoteStyle } from '@/types/quote';
import { exportQuoteAsImage } from '@/utils/export-image';

type HomeQuote = QuoteListItem & {
  viewerState: {
    isFavorited: boolean;
    viewerHeartbeatCount: number;
  };
};

const QUOTE_STYLE_STORAGE_KEY = 'golden-home-quote-style';
const APPEND_RETRY_LIMIT = 3;

export function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<HomeQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [reflections, setReflections] = useState<ReflectionItem[]>([]);
  const [reflectionDraft, setReflectionDraft] = useState('');
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
  const quotesRef = useRef<HomeQuote[]>([]);
  const loadingNextRef = useRef(false);

  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchHitokoto()
      .then((response) => {
        if (!active) {
          return;
        }

        setQuotes([toHomeQuote(response.quote)]);
        setCurrentIndex(0);
      })
      .catch(() => {
        if (active) {
          setError('首页金句加载失败，请稍后重试。');
        }
      })
      .finally(() => {
        if (active) {
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

  async function appendNextQuote(attempt = 0) {
    const response = await fetchHitokoto();
    const nextQuote = toHomeQuote(response.quote);

    if (quotesRef.current.some((item) => item.id === nextQuote.id)) {
      if (attempt >= APPEND_RETRY_LIMIT) {
        return;
      }

      await appendNextQuote(attempt + 1);
      return;
    }

    const nextIndex = quotesRef.current.length;
    setQuotes((current) => [...current, nextQuote]);
    setCurrentIndex(nextIndex);
  }

  async function maybeAppendNextQuote() {
    if (loadingNextRef.current) {
      return;
    }

    loadingNextRef.current = true;
    setLoadingNext(true);
    setError(null);

    try {
      await appendNextQuote();
    } catch {
      setError('下一句获取失败，请稍后重试。');
    } finally {
      loadingNextRef.current = false;
      setLoadingNext(false);
    }
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const rawIndex = Math.round(container.scrollTop / Math.max(container.clientHeight, 1));
    const nextIndex = Math.min(Math.max(rawIndex, 0), Math.max(quotes.length - 1, 0));

    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < quotes.length) {
      setCurrentIndex(nextIndex);
    }

    if (rawIndex >= quotes.length - 1) {
      void maybeAppendNextQuote();
    }
  }

  async function handleFavorite() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt('登录后才能收藏、心动或记录感悟。');
      return;
    }

    const method = currentQuote.viewerState.isFavorited ? unfavoriteQuote : favoriteQuote;
    await method(currentQuote.id);

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
  }

  async function handleHeartbeat() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt('登录后才能收藏、心动或记录感悟。');
      return;
    }

    const response = await heartbeatQuote(currentQuote.id);
    setQuotes((current) =>
      current.map((item, index) =>
        index === currentIndex
          ? {
              ...item,
              viewerState: {
                ...item.viewerState,
                viewerHeartbeatCount: response.count,
              },
            }
          : item,
      ),
    );
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
    if (!currentQuote || !reflectionDraft.trim() || !user) {
      return;
    }

    const response = await createReflection({
      quoteId: currentQuote.id,
      content: reflectionDraft.trim(),
    });

    setReflections((current) => [...current, response.reflection]);
    setReflectionDraft('');
  }

  async function handleExport() {
    if (!activeCardRef.current || !currentQuote) {
      return;
    }

    await exportQuoteAsImage(activeCardRef.current, `golden-${currentQuote.id}.png`);
  }

  if (authLoading || loading) {
    return (
      <section className="relative min-h-[calc(100vh-12rem)]">
        <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
          <div className="flex h-full w-full items-center justify-center rounded-[2.4rem] border border-stone-200/70 bg-[linear-gradient(160deg,#f7f2e8,#efe5d2)] p-10 shadow-[0_20px_50px_rgba(28,25,23,0.08)]">
            <p className="font-serif text-2xl leading-[1.8] text-stone-500">正在接住下一句。</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[calc(100vh-12rem)]">
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-col items-center gap-2 px-4">
        {loginPrompt ? (
          <div className="pointer-events-auto rounded-full border border-amber-200/80 bg-amber-50/95 px-4 py-2 text-sm text-amber-900 shadow-sm backdrop-blur">
            <p>{loginPrompt}</p>
            <Link className="ml-2 inline-block underline underline-offset-4" to="/auth/login">
              去登录
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="pointer-events-auto rounded-full bg-stone-900/80 px-4 py-2 text-sm text-white shadow-sm">
            {error}
          </p>
        ) : null}
      </div>

      <div
        ref={streamRef}
        className="h-[calc(100vh-12rem)] snap-y snap-mandatory overflow-y-auto"
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

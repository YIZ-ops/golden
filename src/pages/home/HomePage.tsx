import { useEffect, useMemo, useRef, useState, type ReactNode, type UIEvent } from 'react';
import { Link } from 'react-router-dom';

import { LoadingScreen } from '@/components/common/LoadingScreen';
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
import { fetchHitokoto, getQuotes, type QuoteListItem } from '@/services/api/quotes';
import type { QuoteStyle } from '@/types/quote';
import { exportQuoteAsImage } from '@/utils/export-image';

type HomeQuote = QuoteListItem & {
  viewerState: {
    isFavorited: boolean;
    viewerHeartbeatCount: number;
  };
};

const QUOTE_STYLE_STORAGE_KEY = 'golden-home-quote-style';

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getQuotes({ page: 1, pageSize: 20 })
      .then((response) => {
        if (!active) {
          return;
        }

        setQuotes(
          response.items.map((item) => ({
            ...item,
            viewerState: item.viewerState ?? {
              isFavorited: false,
              viewerHeartbeatCount: 0,
            },
          })),
        );
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

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const nextIndex = Math.round(container.scrollTop / Math.max(container.clientHeight, 1));

    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < quotes.length) {
      setCurrentIndex(nextIndex);
    }
  }

  async function handleNextQuote() {
    setLoadingNext(true);
    setError(null);

    try {
      const response = await fetchHitokoto();
      const nextQuote: HomeQuote = {
        ...response.quote,
        viewerState: {
          isFavorited: false,
          viewerHeartbeatCount: 0,
        },
      };

      setQuotes((current) => [...current, nextQuote]);
      setCurrentIndex(quotes.length);
    } catch {
      setError('下一句获取失败，请稍后重试。');
    } finally {
      setLoadingNext(false);
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

  const titleCopy = useMemo(
    () =>
      currentQuote
        ? `正在阅读第 ${currentIndex + 1} 句，共 ${quotes.length} 句`
        : '滚动流会把当下这一句推到前景',
    [currentIndex, currentQuote, quotes.length],
  );

  if (authLoading || loading) {
    return (
      <section className="space-y-4">
        <HomeHero subtitle="滚动流会把当下这一句推到前景" />
        <LoadingScreen />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <HomeHero subtitle={titleCopy}>
        {loginPrompt ? (
          <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>{loginPrompt}</p>
            <Link className="mt-2 inline-block underline underline-offset-4" to="/auth/login">
              去登录
            </Link>
          </div>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
      </HomeHero>

      <div
        ref={streamRef}
        className="max-h-[70vh] snap-y snap-mandatory overflow-y-auto rounded-[2rem]"
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
        loadingNext={loadingNext}
        onExport={handleExport}
        onFavorite={handleFavorite}
        onHeartbeat={handleHeartbeat}
        onNextQuote={handleNextQuote}
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

function HomeHero({
  subtitle,
  children,
}: {
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(135deg,#fffef8,#f3efe2)] p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Home</p>
      <h2 className="mt-3 font-serif text-3xl text-stone-900">首页</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">{subtitle}</p>
      {children}
    </div>
  );
}

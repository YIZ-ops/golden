import { useEffect, useRef, useState, type UIEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { QuoteActions } from "@/components/quote/QuoteActions";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { QuoteCard } from "@/components/quote/QuoteCard";
import { ReflectionPanel } from "@/components/reflection/ReflectionPanel";
import { StyleEditorDrawer } from "@/components/style/StyleEditorDrawer";
import { DEFAULT_QUOTE_STYLE } from "@/constants/quote-style";
import { useAuth } from "@/hooks/useAuth";
import { favoriteQuote, getFavoriteFolders, unfavoriteQuote, type FavoriteFolder } from "@/services/api/favorites";
import { heartbeatQuote } from "@/services/api/heartbeats";
import { createReflection, deleteReflection, getReflections, type ReflectionItem } from "@/services/api/reflections";
import { getHomeQuotes, type QuoteListItem } from "@/services/api/quotes";
import type { QuoteStyle } from "@/types/quote";
import { exportQuoteAsImage } from "@/utils/export-image";

type HomeQuote = QuoteListItem & {
  viewerState: {
    isFavorited: boolean;
    viewerHeartbeatCount: number;
  };
};

const QUOTE_STYLE_STORAGE_KEY = "golden-home-quote-style";
const QUOTE_BUFFER_SIZE = 5;
const HOME_QUOTES_CACHE_KEY = "golden-home-quotes-cache";
const HOME_QUOTES_CACHE_TTL_MS = 30_000;

type HomeRouteState = {
  focusQuote?: QuoteListItem;
};

export function HomePage() {
  const location = useLocation();
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
  const [reflectionDraft, setReflectionDraft] = useState("");
  const [favoritePickerOpen, setFavoritePickerOpen] = useState(false);
  const [favoriteFoldersLoading, setFavoriteFoldersLoading] = useState(false);
  const [favoriteFolders, setFavoriteFolders] = useState<FavoriteFolder[]>([]);
  const [favoritePickerError, setFavoritePickerError] = useState<string | null>(null);
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>(() => {
    if (typeof window === "undefined") {
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
  const skipNextScrollSyncRef = useRef(false);

  useEffect(() => {
    const routeState = (location.state ?? {}) as HomeRouteState;
    const focusQuote = routeState.focusQuote ? toHomeQuote(routeState.focusQuote) : null;
    const cacheUserId = user?.id ?? null;
    const cachedItems = readHomeQuotesCache(cacheUserId);
    const hasCachedItems = Boolean(cachedItems && cachedItems.length > 0);

    if (hasCachedItems && cachedItems) {
      const cachedQuotes = cachedItems.map(toHomeQuote);
      const nextCachedQuotes = focusQuote ? [focusQuote, ...cachedQuotes.filter((item) => item.id !== focusQuote.id)] : cachedQuotes;

      if (nextCachedQuotes.length > 0) {
        setQuotes(nextCachedQuotes);
        setCurrentIndex(0);
        setLoading(false);
      }
    } else {
      setLoading(true);
    }

    let active = true;
    setError(null);

    loadQuoteBatch(focusQuote ? [focusQuote.id] : [])
      .then((response) => {
        if (!active) {
          return;
        }

        const loadedQuotes = response.items.map(toHomeQuote);
        const nextQuotes = focusQuote ? [focusQuote, ...loadedQuotes.filter((item) => item.id !== focusQuote.id)] : loadedQuotes;

        if (nextQuotes.length === 0) {
          if (!hasCachedItems) {
            setError("首页金句加载失败，请稍后重试。");
            setLoading(false);
          }
          return;
        }

        writeHomeQuotesCache(cacheUserId, response.items);
        setQuotes(nextQuotes);
        setCurrentIndex(0);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          if (!hasCachedItems) {
            setError("首页金句加载失败，请稍后重试。");
            setLoading(false);
          }
        }
      });

    return () => {
      active = false;
    };
  }, [location.key, location.state, user?.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
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
    if (skipNextScrollSyncRef.current) {
      skipNextScrollSyncRef.current = false;
      return;
    }

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
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ left: nextOffset, behavior: "smooth" });
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

    skipNextScrollSyncRef.current = true;
    syncStreamPosition(nextIndex);
    setCurrentIndex(nextIndex);
  }

  function loadQuoteBatch(excludeIds: string[] = []) {
    return excludeIds.length > 0 ? getHomeQuotes(QUOTE_BUFFER_SIZE, excludeIds) : getHomeQuotes(QUOTE_BUFFER_SIZE);
  }

  async function handleFavorite() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt("登录后才能收藏、心动或记录感悟。");
      return;
    }

    try {
      if (currentQuote.viewerState.isFavorited) {
        await unfavoriteQuote(currentQuote.id);

        setError(null);
        setQuotes((current) =>
          current.map((item, index) =>
            index === currentIndex
              ? {
                  ...item,
                  viewerState: {
                    ...item.viewerState,
                    isFavorited: false,
                  },
                }
              : item,
          ),
        );
        return;
      }

      setFavoritePickerOpen(true);
      setFavoriteFoldersLoading(true);
      setFavoritePickerError(null);

      const response = await getFavoriteFolders();
      setFavoriteFolders(response.items);
    } catch {
      setFavoritePickerError("收藏夹加载失败，请稍后重试。");
      setError("收藏操作失败，请稍后重试。");
    } finally {
      setFavoriteFoldersLoading(false);
    }
  }

  async function handleFavoriteToFolder(folderId: string) {
    if (!currentQuote) {
      return;
    }

    try {
      await favoriteQuote(currentQuote.id, folderId);

      setFavoritePickerOpen(false);
      setFavoritePickerError(null);
      setError(null);
      setQuotes((current) =>
        current.map((item, index) =>
          index === currentIndex
            ? {
                ...item,
                viewerState: {
                  ...item.viewerState,
                  isFavorited: true,
                },
              }
            : item,
        ),
      );
    } catch {
      setFavoritePickerError("收藏失败，请稍后重试。");
      setError("收藏操作失败，请稍后重试。");
    }
  }

  async function handleHeartbeat() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt("登录后才能收藏、心动或记录感悟。");
      return;
    }

    try {
      const response = await heartbeatQuote(currentQuote.id);
      const nextCount = normalizeHeartbeatCount(response);

      if (nextCount === null) {
        setError("记录心动失败，请稍后重试。");
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
      setError("记录心动失败，请稍后重试。");
    }
  }

  async function handleOpenReflections() {
    if (!currentQuote) {
      return;
    }

    if (!user) {
      setLoginPrompt("登录后才能收藏、心动或记录感悟。");
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
      setReflectionDraft("");
    } finally {
      setReflectionSubmitting(false);
    }
  }

  async function handleDeleteReflection(reflectionId: string) {
    try {
      await deleteReflection(reflectionId);
      setReflections((current) => current.filter((item) => item.id !== reflectionId));
    } catch {
      setError("删除感悟失败，请稍后重试。");
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
      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden overscroll-y-none">
        <LoadingScreen className="h-full" label="别急别急别急..." />
      </section>
    );
  }

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden overscroll-y-none" data-testid="home-quote-page">
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
        className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
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
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-0">
        <button
          aria-label="上一条金句"
          className="pointer-events-auto -translate-x-4 flex h-12 w-12 items-center justify-center rounded-full text-stone-500/70 transition disabled:cursor-default disabled:opacity-30"
          disabled={currentIndex === 0}
          onClick={() => handleStep(-1)}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="下一条金句"
          className="pointer-events-auto translate-x-4 flex h-12 w-12 items-center justify-center rounded-full text-stone-500/70 transition disabled:cursor-default disabled:opacity-30"
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
      {favoritePickerOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end bg-stone-950/35 backdrop-blur-sm"
          data-testid="favorite-picker-backdrop"
          onClick={() => setFavoritePickerOpen(false)}
        >
          <div
            className="app-surface app-border mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="app-text font-serif text-xl">选择收藏夹</h3>
              <button className="app-muted text-sm" onClick={() => setFavoritePickerOpen(false)} type="button">
                关闭
              </button>
            </div>

            {favoriteFoldersLoading ? <LoadingScreen compact label="收藏夹加载中" /> : null}
            {!favoriteFoldersLoading && favoritePickerError ? <p className="mt-3 text-sm text-red-500">{favoritePickerError}</p> : null}

            {!favoriteFoldersLoading && !favoritePickerError ? (
              <div className="mt-4 grid gap-3 overflow-y-auto pr-1">
                {favoriteFolders.map((folder) => (
                  <button
                    key={folder.id}
                    className="app-input app-text flex items-center justify-between rounded-[1.5rem] px-4 py-3 text-left text-sm"
                    onClick={() => void handleFavoriteToFolder(folder.id)}
                    type="button"
                  >
                    <span>{folder.name}</span>
                    <span className="app-muted text-xs">{folder.quoteCount} 条</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <ReflectionPanel
        draft={reflectionDraft}
        items={reflections}
        loading={reflectionsLoading}
        onClose={() => setReflectionOpen(false)}
        onDelete={(reflectionId) => void handleDeleteReflection(reflectionId)}
        onDraftChange={setReflectionDraft}
        onSubmit={handleCreateReflection}
        open={reflectionOpen}
        submitting={reflectionSubmitting}
      />
      <StyleEditorDrawer
        onChange={setQuoteStyle}
        onClose={() => setStyleOpen(false)}
        open={styleOpen}
        previewQuote={currentQuote ?? undefined}
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
  if (!response || typeof response !== "object" || !("count" in response)) {
    return null;
  }

  const rawCount = (response as { count?: unknown }).count;
  const normalized = typeof rawCount === "number" ? rawCount : typeof rawCount === "string" && rawCount.trim() !== "" ? Number(rawCount) : Number.NaN;

  return Number.isFinite(normalized) ? normalized : null;
}

interface HomeQuotesCachePayload {
  userId: string | null;
  cachedAt: number;
  items: QuoteListItem[];
}

function readHomeQuotesCache(userId: string | null) {
  if (!isHomeQuotesCacheEnabled()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(HOME_QUOTES_CACHE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HomeQuotesCachePayload>;

    if (!Array.isArray(parsed.items) || typeof parsed.cachedAt !== "number" || parsed.userId !== userId) {
      return null;
    }

    if (Date.now() - parsed.cachedAt > HOME_QUOTES_CACHE_TTL_MS) {
      return null;
    }

    return parsed.items;
  } catch {
    window.sessionStorage.removeItem(HOME_QUOTES_CACHE_KEY);
    return null;
  }
}

function writeHomeQuotesCache(userId: string | null, items: QuoteListItem[]) {
  if (!isHomeQuotesCacheEnabled()) {
    return;
  }

  const payload: HomeQuotesCachePayload = {
    userId,
    cachedAt: Date.now(),
    items,
  };

  window.sessionStorage.setItem(HOME_QUOTES_CACHE_KEY, JSON.stringify(payload));
}

function isHomeQuotesCacheEnabled() {
  return typeof window !== "undefined" && import.meta.env.MODE !== "test";
}

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronDown, PenSquare, Plus } from "lucide-react";

import { StarBottle } from "@/components/StarBottle";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/services/api/client";
import { createFavoriteFolder, favoriteQuote, getFavoriteFolders, type FavoriteFolder } from "@/services/api/favorites";
import { createQuote } from "@/services/api/quotes";
import { clearSessionAndRedirect } from "@/services/supabase/session";

export function FavoritesPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [manualQuoteOpen, setManualQuoteOpen] = useState(false);
  const [manualQuoteContent, setManualQuoteContent] = useState("");
  const [manualQuoteAuthor, setManualQuoteAuthor] = useState("");
  const [manualQuoteSource, setManualQuoteSource] = useState("");
  const [manualQuoteCategory, setManualQuoteCategory] = useState("");
  const [manualQuoteFolderId, setManualQuoteFolderId] = useState("");
  const [manualQuoteFolderPickerOpen, setManualQuoteFolderPickerOpen] = useState(false);
  const [manualQuoteError, setManualQuoteError] = useState<string | null>(null);
  const [savingManualQuote, setSavingManualQuote] = useState(false);

  const loadFolders = useCallback(async () => {
    if (!user) {
      setFolders([]);
      return;
    }

    setLoadingFolders(true);
    setError(null);

    try {
      const result = await getFavoriteFolders();
      setFolders(result.items);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "获取收藏夹失败。");
    } finally {
      setLoadingFolders(false);
    }
  }, [user]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  async function handleCreateFolder() {
    const name = newFolderName.trim();

    if (!name) {
      setError("收藏夹名称不能为空。");
      return;
    }

    try {
      setError(null);
      await createFavoriteFolder(name);
      setCreating(false);
      setNewFolderName("");
      await loadFolders();
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "创建收藏夹失败。");
    }
  }

  function openManualQuoteDrawer() {
    setManualQuoteError(null);
    setManualQuoteFolderPickerOpen(false);
    setManualQuoteOpen(true);
  }

  function closeManualQuoteDrawer() {
    setManualQuoteFolderPickerOpen(false);
    setManualQuoteOpen(false);
  }

  function resetManualQuoteForm() {
    setManualQuoteContent("");
    setManualQuoteAuthor("");
    setManualQuoteSource("");
    setManualQuoteCategory("");
    setManualQuoteFolderId("");
    setManualQuoteFolderPickerOpen(false);
    setManualQuoteError(null);
  }

  async function handleManualQuoteSubmit() {
    const content = manualQuoteContent.trim();
    const author = manualQuoteAuthor.trim();
    const source = manualQuoteSource.trim();
    const category = manualQuoteCategory.trim();
    const folderId = manualQuoteFolderId.trim();

    if (!content || !author || !folderId) {
      setManualQuoteError("请填写句子内容、作者并选择收藏夹。");
      return;
    }

    try {
      setSavingManualQuote(true);
      setManualQuoteError(null);

      const created = await createQuote({
        content,
        author,
        source: source || undefined,
        category: category || undefined,
      });

      await favoriteQuote(created.quote.id, folderId);
      resetManualQuoteForm();
      closeManualQuoteDrawer();
      await loadFolders();
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setManualQuoteError(requestError instanceof Error ? requestError.message : "保存句子失败。");
    } finally {
      setSavingManualQuote(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="正在确认登录状态..." />;
  }

  if (!user) {
    return (
      <section className="space-y-4">
        <IntroCopy>登录后即可把喜欢的句子留在收藏夹里。</IntroCopy>
        <div className="app-border border-t pt-4">
          <Link className="app-button-primary rounded-2xl px-4 py-3 text-sm" to="/auth/login">
            去登录
          </Link>
        </div>
      </section>
    );
  }

  const selectedManualQuoteFolder = folders.find((folder) => folder.id === manualQuoteFolderId) ?? null;

  return (
    <section className="space-y-4 pb-24">
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-4">
          <button
            aria-label="新建收藏夹"
            className="app-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm"
            onClick={() => setCreating((current: boolean) => !current)}
            type="button"
          >
            <Plus size={14} />
            新建
          </button>
        </div>

        {error ? <p className="mt-5 text-sm text-red-500">{error}</p> : null}

        {loadingFolders ? <LoadingScreen compact label="收藏夹加载中" /> : null}

        {!loadingFolders && !error && folders.length === 0 ? <p className="mt-6 text-sm text-stone-500">还没有收藏夹，先新建一个吧。</p> : null}

        <div className="mt-6 grid grid-cols-2 gap-4">
          {folders.map((folder) => (
            <article key={folder.id} className="flex items-center justify-center rounded-2xl border border-stone-200/80 bg-[#f8f4eb]">
              <button
                className="inline-flex w-full items-center justify-center"
                onClick={() => navigate(`/favorites/${folder.id}`, { state: { folderName: folder.name } })}
                type="button"
              >
                <div className="flex w-full justify-center">
                  <div className="origin-center scale-[0.85]">
                    <StarBottle color="#f59e0b" count={folder.quoteCount} isDarkMode={false} label={folder.name} shape="vial" />
                  </div>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>

      <button
        aria-label="添加句子"
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-[0_18px_40px_rgba(28,25,23,0.2)]"
        onClick={openManualQuoteDrawer}
        type="button"
      >
        <PenSquare size={20} />
      </button>

      {creating ? (
        <div className="fixed inset-0 z-40 flex items-end bg-stone-950/35 backdrop-blur-sm" onClick={() => setCreating(false)}>
          <div
            className="app-surface app-border mx-auto flex w-full max-w-md flex-col rounded-t-3xl border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="app-text font-serif text-xl">新建收藏夹</h3>
              <button className="app-muted text-sm" onClick={() => setCreating(false)} type="button">
                关闭
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                maxLength={24}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="输入收藏夹名称（最多 24 字）"
                value={newFolderName}
              />
              <button
                className="app-button-primary w-full rounded-[1.5rem] px-4 py-3 text-sm"
                onClick={() => void handleCreateFolder()}
                type="button"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manualQuoteOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end bg-stone-950/35 backdrop-blur-sm"
          data-testid="manual-quote-backdrop"
          onClick={closeManualQuoteDrawer}
        >
          <div
            className="app-surface app-border mx-auto flex w-full max-w-md flex-col rounded-t-3xl border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            data-testid="manual-quote-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="app-text font-serif text-xl">添加句子</h3>
              <button className="app-muted text-sm" onClick={closeManualQuoteDrawer} type="button">
                关闭
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {manualQuoteError ? <p className="text-sm text-red-500">{manualQuoteError}</p> : null}

              <label className="app-text block space-y-2 text-sm">
                <span>句子内容</span>
                <textarea
                  className="app-input min-h-28 w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setManualQuoteContent(event.target.value)}
                  value={manualQuoteContent}
                />
              </label>

              <label className="app-text block space-y-2 text-sm">
                <span>作者</span>
                <input
                  className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setManualQuoteAuthor(event.target.value)}
                  value={manualQuoteAuthor}
                />
              </label>

              <label className="app-text block space-y-2 text-sm">
                <span>来源</span>
                <input
                  className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setManualQuoteSource(event.target.value)}
                  value={manualQuoteSource}
                />
              </label>

              <label className="app-text block space-y-2 text-sm">
                <span>分类</span>
                <input
                  className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setManualQuoteCategory(event.target.value)}
                  value={manualQuoteCategory}
                />
              </label>

              <label className="app-text block space-y-2 text-sm">
                <span>收藏夹</span>
                <div className="relative">
                  <button
                    className="app-input flex w-full items-center justify-between rounded-[1.5rem] px-4 py-3 text-left text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={folders.length === 0}
                    onClick={() => setManualQuoteFolderPickerOpen((current) => !current)}
                    type="button"
                  >
                    <span className={selectedManualQuoteFolder ? "app-text" : "app-muted"}>
                      {selectedManualQuoteFolder ? selectedManualQuoteFolder.name : folders.length === 0 ? "请先新建收藏夹" : "请选择收藏夹"}
                    </span>
                    <ChevronDown className={manualQuoteFolderPickerOpen ? "app-muted rotate-180" : "app-muted"} size={16} />
                  </button>

                  {manualQuoteFolderPickerOpen && folders.length > 0 ? (
                    <div className="app-card absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-10 max-h-56 overflow-auto rounded-2xl p-1 shadow-[0_10px_30px_rgba(28,25,23,0.12)]">
                      {folders.map((folder) => {
                        const selected = folder.id === manualQuoteFolderId;

                        return (
                          <button
                            key={folder.id}
                            className={`app-text flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--app-input-focus)] ${selected ? "bg-[var(--app-input)]" : ""}`}
                            onClick={() => {
                              setManualQuoteFolderId(folder.id);
                              setManualQuoteFolderPickerOpen(false);
                            }}
                            type="button"
                          >
                            <span>{folder.name}</span>
                            {selected ? <Check className="app-text" size={14} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </label>

              <button
                className="app-button-primary w-full rounded-[1.5rem] px-4 py-3 text-sm"
                onClick={() => void handleManualQuoteSubmit()}
                type="button"
              >
                {savingManualQuote ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function IntroCopy({ children }: { children: string }) {
  return <p className="app-border app-muted border-b pb-4 text-sm leading-6">{children}</p>;
}

function isUnauthorizedError(error: unknown) {
  return (
    (error instanceof ApiClientError && error.status === 401) ||
    (Boolean(error) && typeof error === "object" && "status" in error && (error as { status?: unknown }).status === 401)
  );
}

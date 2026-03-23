import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, PencilLine, Trash2 } from "lucide-react";

import { LoadingScreen } from "@/components/common/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { QuoteInfiniteList } from "@/pages/categories/components/QuoteInfiniteList";
import { ApiClientError } from "@/services/api/client";
import {
  deleteFavoriteFolder,
  getFavoriteFolderQuotes,
  getFavoriteFolders,
  renameFavoriteFolder,
  type FavoriteFolder,
} from "@/services/api/favorites";
import { deleteQuote, updateQuote } from "@/services/api/quotes";
import { clearSessionAndRedirect } from "@/services/supabase/session";
import type { QuoteListItem } from "@/services/api/quotes";

type FolderRouteParams = {
  folderId?: string;
};

type FolderRouteState = {
  folderName?: string;
};

type HomeRouteState = {
  focusQuote?: QuoteListItem;
};

export function FavoriteFolderQuotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { folderId } = useParams<FolderRouteParams>();
  const routeState = (location.state ?? {}) as FolderRouteState;
  const [folder, setFolder] = useState<FavoriteFolder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [quoteReloadKey, setQuoteReloadKey] = useState(0);
  const [editingQuote, setEditingQuote] = useState<QuoteListItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [quoteDeleteTarget, setQuoteDeleteTarget] = useState<QuoteListItem | null>(null);

  useEffect(() => {
    if (!renameOpen && !deleteOpen) {
      return;
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setRenameOpen(false);
      setDeleteOpen(false);
    }

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [deleteOpen, renameOpen]);

  useEffect(() => {
    if (!user || !folderId) {
      return;
    }

    let active = true;
    setError(null);

    getFavoriteFolders()
      .then((response) => {
        if (!active) {
          return;
        }

        const matched = response.items.find((item) => item.id === folderId) ?? null;
        setFolder(matched);
        setRenameDraft(matched?.name ?? routeState.folderName ?? "");
      })
      .catch(async (requestError: unknown) => {
        if (!active) {
          return;
        }

        if (isUnauthorizedError(requestError)) {
          await clearSessionAndRedirect("/auth/login");
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "获取收藏夹信息失败。");
      })
      .finally(() => {
        // no-op: avoid duplicated loading indicators with QuoteInfiniteList
      });

    return () => {
      active = false;
    };
  }, [folderId, routeState.folderName, user]);

  if (loading) {
    return <LoadingScreen label="正在确认登录状态..." />;
  }

  if (!user) {
    return (
      <section className="space-y-4">
        <p className="border-b border-stone-200/70 pb-4 text-sm leading-6 text-stone-600">登录后即可查看收藏夹里的句子。</p>
        <div className="border-t border-stone-200/70 pt-4">
          <Link className="rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white" to="/auth/login">
            去登录
          </Link>
        </div>
      </section>
    );
  }

  if (!folderId) {
    return <p className="text-sm text-stone-500">收藏夹参数无效，请返回重试。</p>;
  }

  async function handleRenameFolder() {
    if (!folder) {
      return;
    }

    const nextName = renameDraft.trim();

    if (!nextName) {
      setError("收藏夹名称不能为空。");
      return;
    }

    if (nextName === folder.name) {
      setRenameOpen(false);
      return;
    }

    try {
      setError(null);
      const result = await renameFavoriteFolder(folder.id, nextName);
      setFolder(result.item);
      setRenameOpen(false);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "重命名收藏夹失败。");
    }
  }

  async function handleDeleteFolder() {
    if (!folder || folder.isDefault) {
      return;
    }

    try {
      setError(null);
      await deleteFavoriteFolder(folder.id);
      setDeleteOpen(false);
      navigate("/favorites");
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "删除收藏夹失败。");
    }
  }

  function handleOpenQuote(item: QuoteListItem) {
    navigate("/", {
      state: {
        focusQuote: item,
      } satisfies HomeRouteState,
    });
  }

  function canManageQuote(item: QuoteListItem) {
    return Boolean(user?.id) && item.sourceType === "manual" && item.createdBy === user?.id;
  }

  function openEditQuote(item: QuoteListItem) {
    setError(null);
    setEditingQuote(item);
    setEditContent(item.content ?? "");
    setEditAuthor(item.author ?? "");
    setEditSource(item.source ?? "");
    setEditCategory(item.category ?? "");
  }

  async function handleSaveQuoteEdit() {
    if (!editingQuote) {
      return;
    }

    const content = editContent.trim();
    const author = editAuthor.trim();

    if (!content || !author) {
      setError("句子内容和作者不能为空。");
      return;
    }

    try {
      setError(null);
      await updateQuote({
        quoteId: editingQuote.id,
        content,
        author,
        source: editSource.trim() || undefined,
        category: editCategory.trim() || undefined,
      });
      setEditingQuote(null);
      setQuoteReloadKey((current) => current + 1);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "编辑句子失败。");
    }
  }

  async function handleDeleteQuote() {
    if (!quoteDeleteTarget) {
      return;
    }

    try {
      setError(null);
      await deleteQuote(quoteDeleteTarget.id);
      setQuoteDeleteTarget(null);
      setQuoteReloadKey((current) => current + 1);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        await clearSessionAndRedirect("/auth/login");
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "删除句子失败。");
    }
  }

  const folderTitle = folder?.name || routeState.folderName || "收藏列表";

  return (
    <section className="relative space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button
          className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
          onClick={() => navigate("/favorites")}
          type="button"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="app-text flex-1 truncate text-center font-serif text-xl">{folderTitle}</h2>
        <div className="flex items-center gap-2">
          <button
            aria-label="修改收藏夹"
            className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
            onClick={() => setRenameOpen(true)}
            type="button"
          >
            <PencilLine size={14} />
          </button>
          <button
            aria-label="删除收藏夹"
            className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
            disabled={Boolean(folder?.isDefault)}
            onClick={() => setDeleteOpen(true)}
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <QuoteInfiniteList
        emptyDescription="这个收藏夹里还没有句子，先去首页点亮一颗星吧。"
        fetchPage={(params) => getFavoriteFolderQuotes({ folderId, page: params.page ?? 1, pageSize: params.pageSize ?? 20 })}
        initialLoadingLabel="收藏夹加载中"
        invalidErrorMessage="收藏夹参数无效，请返回重试。"
        onItemClick={handleOpenQuote}
        reloadKey={quoteReloadKey}
        renderItemActions={(item) => {
          if (!canManageQuote(item)) {
            return null;
          }

          return (
            <>
              <button
                aria-label="编辑句子"
                className="text-stone-400 transition hover:text-stone-600"
                onClick={(event) => {
                  event.stopPropagation();
                  openEditQuote(item);
                }}
                type="button"
              >
                <PencilLine size={12} />
              </button>
              <button
                aria-label="删除句子"
                className="text-stone-400 transition hover:text-stone-600"
                onClick={(event) => {
                  event.stopPropagation();
                  setQuoteDeleteTarget(item);
                }}
                type="button"
              >
                <Trash2 size={12} />
              </button>
            </>
          );
        }}
        queryParams={{ folderId }}
        requestErrorMessage="加载收藏夹失败，请稍后重试。"
      />

      {editingQuote ? (
        <div className="app-modal-backdrop fixed inset-0 z-40 flex items-end" onClick={() => setEditingQuote(null)}>
          <div
            className="app-surface app-border mx-auto flex w-full max-w-md flex-col rounded-2xl border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="app-text font-serif text-xl">编辑句子</h3>
              <button className="app-muted text-sm" onClick={() => setEditingQuote(null)} type="button">
                关闭
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="app-text block space-y-2 text-sm">
                <span>句子内容</span>
                <textarea
                  className="app-input min-h-28 w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setEditContent(event.target.value)}
                  value={editContent}
                />
              </label>

              <label className="app-text block space-y-2 text-sm">
                <span>作者</span>
                <input
                  className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setEditAuthor(event.target.value)}
                  value={editAuthor}
                />
              </label>

              <label className="app-text block space-y-2 text-sm">
                <span>来源</span>
                <input
                  className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setEditSource(event.target.value)}
                  value={editSource}
                />
              </label>

              <label className="app-text block space-y-2 text-sm">
                <span>分类</span>
                <input
                  className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                  onChange={(event) => setEditCategory(event.target.value)}
                  value={editCategory}
                />
              </label>

              <button
                className="app-button-primary w-full rounded-[1.5rem] px-4 py-3 text-sm"
                onClick={() => void handleSaveQuoteEdit()}
                type="button"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {quoteDeleteTarget ? (
        <div className="app-modal-overlay fixed inset-0 z-40 flex items-center justify-center px-6" onClick={() => setQuoteDeleteTarget(null)}>
          <div className="app-surface app-border w-full max-w-md rounded-3xl border p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="app-text font-serif text-xl">删除句子</h3>
            <p className="app-muted mt-2 text-sm">删除后会从收藏夹中移除且无法恢复，确认继续吗？</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="app-button-secondary rounded-xl px-3 py-2 text-sm" onClick={() => setQuoteDeleteTarget(null)} type="button">
                取消
              </button>
              <button className="app-button-danger rounded-xl px-3 py-2 text-sm" onClick={() => void handleDeleteQuote()} type="button">
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div
          className="app-modal-overlay fixed inset-0 z-40 flex items-center justify-center px-6"
          data-testid="favorite-folder-delete-backdrop"
          onClick={() => setDeleteOpen(false)}
        >
          <div className="app-surface app-border w-full max-w-md rounded-3xl border p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="app-text font-serif text-xl">删除收藏夹</h3>
            <p className="app-muted mt-2 text-sm">删除后其中句子会自动转移到默认收藏夹，确认继续吗？</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="app-button-secondary rounded-xl px-3 py-2 text-sm" onClick={() => setDeleteOpen(false)} type="button">
                取消
              </button>
              <button className="app-button-danger rounded-xl px-3 py-2 text-sm" onClick={() => void handleDeleteFolder()} type="button">
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameOpen ? (
        <div
          className="app-modal-backdrop fixed inset-0 z-40 flex items-end"
          data-testid="favorite-folder-rename-backdrop"
          onClick={() => setRenameOpen(false)}
        >
          <div
            className="app-surface app-border mx-auto flex w-full max-w-md flex-col rounded-2xl border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="app-text font-serif text-xl">修改收藏夹名称</h3>
              <button className="app-muted text-sm" onClick={() => setRenameOpen(false)} type="button">
                关闭
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                autoFocus
                className="app-input w-full rounded-[1.5rem] px-4 py-3 text-sm outline-none"
                maxLength={24}
                onChange={(event) => setRenameDraft(event.target.value)}
                placeholder="输入收藏夹名称"
                value={renameDraft}
              />
              <button
                className="app-button-primary w-full rounded-[1.5rem] px-4 py-3 text-sm"
                onClick={() => void handleRenameFolder()}
                type="button"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function isUnauthorizedError(error: unknown) {
  return (
    (error instanceof ApiClientError && error.status === 401) ||
    (Boolean(error) && typeof error === "object" && "status" in error && (error as { status?: unknown }).status === 401)
  );
}

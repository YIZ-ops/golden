import { LoadingScreen } from "@/components/common/LoadingScreen";
import { EmptyState } from "@/components/common/EmptyState";
import { PixelCat } from "@/components/PixelCat";

interface ReflectionItem {
  id: string;
  content: string;
  createdAt?: string;
}

interface ReflectionPanelProps {
  open: boolean;
  loading: boolean;
  submitting?: boolean;
  items: ReflectionItem[];
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onDelete: (reflectionId: string) => void;
  onSubmit: () => void;
}

export function ReflectionPanel({
  open,
  loading,
  submitting = false,
  items,
  draft,
  onDraftChange,
  onClose,
  onDelete,
  onSubmit,
}: ReflectionPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-stone-950/35 backdrop-blur-sm" data-testid="reflection-panel-backdrop" onClick={onClose}>
      <div
        className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border border-stone-200/80 bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(28,25,23,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-serif text-xl text-stone-900">感悟记录</h3>
          <button className="text-sm text-stone-500" onClick={onClose} type="button">
            关闭
          </button>
        </div>

        <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
          {loading ? <LoadingScreen compact label="感悟加载中..." /> : null}
          {!loading && items.length === 0 ? <EmptyState title="还没有感悟" description="写下这一句触动你的原因，它会保存在这里。" /> : null}
          {!loading &&
            items.map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <p className="font-serif text-base leading-7 text-stone-900">{item.content}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {item.createdAt ? <p className="text-xs text-stone-500">{formatReflectionTime(item.createdAt)}</p> : <span />}
                  <button className="text-xs text-stone-400 transition hover:text-red-500" onClick={() => onDelete(item.id)} type="button">
                    删除感悟
                  </button>
                </div>
              </article>
            ))}
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="sr-only">新增感悟</span>
            <textarea
              aria-label="新增感悟"
              className="min-h-28 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-800 outline-none transition focus:border-stone-400"
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="写下此刻的想法..."
              value={draft}
            />
          </label>
          <button
            aria-label="提交感悟"
            className="w-full rounded-[1.5rem] bg-stone-900 px-4 py-3 text-sm text-white"
            disabled={submitting}
            onClick={onSubmit}
            type="button"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <PixelCat ariaLabel="loading-cat" className="text-white" size={16} />
                <span>提交中...</span>
              </span>
            ) : (
              "提交感悟"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatReflectionTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  })
    .format(date)
    .replace(",", "");
}

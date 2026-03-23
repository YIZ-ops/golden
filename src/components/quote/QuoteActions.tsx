import type { ReactNode } from "react";
import { Heart, MessageSquare, Palette, Star, Download } from "lucide-react";

import { cn } from "@/utils/cn";

interface QuoteActionsProps {
  isFavorited: boolean;
  heartbeatCount: number;
  onFavorite: () => void;
  onHeartbeat: () => void;
  onOpenReflections: () => void;
  onOpenStyleEditor: () => void;
  onExport: () => void;
}

export function QuoteActions({
  isFavorited,
  heartbeatCount,
  onFavorite,
  onHeartbeat,
  onOpenReflections,
  onOpenStyleEditor,
  onExport,
}: QuoteActionsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+36px)] z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/45 bg-white/35 px-2 py-1 shadow-[0_10px_22px_rgba(28,25,23,0.08)] backdrop-blur-2xl backdrop-saturate-150">
        <ActionButton
          active={heartbeatCount > 0}
          count={heartbeatCount}
          icon={<Heart size={16} />}
          label="心动当前金句"
          onClick={onHeartbeat}
          tone="rose"
        />
        <ActionButton active={isFavorited} icon={<Star size={16} />} label="收藏当前金句" onClick={onFavorite} />
        <ActionButton icon={<MessageSquare size={16} />} label="打开感悟面板" onClick={onOpenReflections} />
        <ActionButton icon={<Palette size={16} />} label="打开样式面板" onClick={onOpenStyleEditor} />
        <ActionButton icon={<Download size={16} />} label="导出当前金句" onClick={onExport} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  active = false,
  count,
  onClick,
  tone = "stone",
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  count?: number;
  onClick: () => void;
  tone?: "stone" | "rose";
}) {
  const activeClass = tone === "rose" ? "text-rose-500" : "text-amber-500";

  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-9 items-center justify-center rounded-full bg-transparent text-stone-600 transition hover:bg-transparent hover:text-stone-900 active:scale-[0.96]",
        count !== undefined ? "min-w-9 gap-1 px-3" : "w-9",
        active ? activeClass : "",
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {count !== undefined ? <span className="text-xs font-medium tabular-nums">{count}</span> : null}
    </button>
  );
}

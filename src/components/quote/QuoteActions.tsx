import type { ReactNode } from 'react';
import { Heart, MessageSquare, Palette, Plus, Star, Download } from 'lucide-react';

import { cn } from '@/utils/cn';

interface QuoteActionsProps {
  isFavorited: boolean;
  heartbeatCount: number;
  loadingNext: boolean;
  onFavorite: () => void;
  onHeartbeat: () => void;
  onOpenReflections: () => void;
  onOpenStyleEditor: () => void;
  onNextQuote: () => void;
  onExport: () => void;
}

export function QuoteActions({
  isFavorited,
  heartbeatCount,
  loadingNext,
  onFavorite,
  onHeartbeat,
  onOpenReflections,
  onOpenStyleEditor,
  onNextQuote,
  onExport,
}: QuoteActionsProps) {
  return (
    <div className="sticky bottom-0 z-20">
      <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-2 shadow-[0_18px_40px_rgba(28,25,23,0.08)] backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <ActionButton active={heartbeatCount > 0} icon={<Heart size={18} />} label="心动当前金句" onClick={onHeartbeat}>
            {heartbeatCount > 0 ? `心动 ${heartbeatCount}` : '心动'}
          </ActionButton>
          <ActionButton active={isFavorited} icon={<Star size={18} />} label="收藏当前金句" onClick={onFavorite}>
            {isFavorited ? '已收藏' : '收藏'}
          </ActionButton>
          <ActionButton icon={<MessageSquare size={18} />} label="打开感悟面板" onClick={onOpenReflections}>
            感悟
          </ActionButton>
          <ActionButton icon={<Palette size={18} />} label="打开样式面板" onClick={onOpenStyleEditor}>
            样式
          </ActionButton>
          <ActionButton icon={<Download size={18} />} label="导出当前金句" onClick={onExport}>
            导出
          </ActionButton>
          <ActionButton
            active
            disabled={loadingNext}
            icon={<Plus size={18} className={cn(loadingNext ? 'animate-spin' : '')} />}
            label="获取下一句"
            onClick={onNextQuote}
          >
            下一句
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  children,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        'flex min-h-20 flex-col items-center justify-center gap-2 rounded-[1.3rem] px-2 py-3 text-xs transition active:scale-[0.98]',
        active ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-700 hover:bg-stone-100',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="text-[11px] font-medium">{children}</span>
    </button>
  );
}

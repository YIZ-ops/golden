import type { ReactNode } from 'react';
import { Heart, MessageSquare, Palette, Star, Download } from 'lucide-react';

import { cn } from '@/utils/cn';

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
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-stone-200/70 bg-white/42 px-2 py-1.5 shadow-[0_16px_32px_rgba(28,25,23,0.12)] backdrop-blur-xl">
        <ActionButton active={heartbeatCount > 0} icon={<Heart size={16} />} label="心动当前金句" onClick={onHeartbeat} />
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
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition hover:bg-white/55 hover:text-stone-900 active:scale-[0.96]',
        active ? 'bg-stone-900/88 text-white shadow-[0_6px_14px_rgba(28,25,23,0.18)]' : '',
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
  );
}

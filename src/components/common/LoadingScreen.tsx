import { PixelCat } from '@/components/PixelCat';
import { cn } from '@/utils/cn';

export function LoadingScreen({
  label = '金句加载中...',
  compact = false,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        'app-muted flex items-center justify-center',
        compact ? 'min-h-[5rem]' : 'min-h-[16rem]',
        className,
      )}
      role="status"
    >
      <div className={cn('flex flex-col items-center text-center', compact ? 'gap-2' : 'gap-3')}>
        <PixelCat ariaLabel="loading-cat" className="app-text" size={compact ? 20 : 28} />
        <p className={cn('app-text font-serif', compact ? 'text-sm' : 'text-lg')}>{label}</p>
      </div>
    </div>
  );
}

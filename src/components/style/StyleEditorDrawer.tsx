import { FONT_FAMILIES } from '@/constants/quote-style';
import type { QuoteStyle } from '@/types/quote';
import { cn } from '@/utils/cn';

interface StyleEditorDrawerProps {
  open: boolean;
  stylePreset: QuoteStyle;
  onChange: (next: QuoteStyle) => void;
  onClose: () => void;
}

export function StyleEditorDrawer({ open, stylePreset, onChange, onClose }: StyleEditorDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-stone-950/20 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2.5rem] border border-stone-200/80 bg-white p-6 shadow-[0_-20px_50px_rgba(28,25,23,0.12)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Style</p>
            <h3 className="mt-2 font-serif text-2xl text-stone-900">卡片样式</h3>
          </div>
          <button className="text-sm text-stone-500" onClick={onClose} type="button">
            关闭
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <label className="block">
            <div className="mb-2 flex items-center justify-between text-sm text-stone-700">
              <span>字号大小</span>
              <span>{stylePreset.fontSize}px</span>
            </div>
            <input
              aria-label="字号大小"
              className="w-full"
              max="40"
              min="18"
              onChange={(event) =>
                onChange({
                  ...stylePreset,
                  fontSize: Number(event.target.value),
                })
              }
              step="1"
              type="range"
              value={stylePreset.fontSize}
            />
          </label>

          <div>
            <p className="mb-3 text-sm text-stone-700">字体选择</p>
            <div className="grid grid-cols-2 gap-2">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  className={cn(
                    'rounded-[1.25rem] border px-3 py-3 text-left text-sm',
                    stylePreset.fontFamily === font.value
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700',
                  )}
                  onClick={() =>
                    onChange({
                      ...stylePreset,
                      fontFamily: font.value,
                    })
                  }
                  style={{ fontFamily: font.value }}
                  type="button"
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm text-stone-700">对齐方式</p>
            <div className="grid grid-cols-3 gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  className={cn(
                    'rounded-full border px-3 py-2 text-sm',
                    stylePreset.textAlign === align
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700',
                  )}
                  onClick={() =>
                    onChange({
                      ...stylePreset,
                      textAlign: align,
                    })
                  }
                  type="button"
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

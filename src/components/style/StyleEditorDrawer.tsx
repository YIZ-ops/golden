import { BACKGROUND_PRESETS, FONT_FAMILIES, LINE_HEIGHT_PRESETS } from "@/constants/quote-style";
import type { QuoteStyle } from "@/types/quote";
import { cn } from "@/utils/cn";

interface StyleEditorDrawerProps {
  open: boolean;
  stylePreset: QuoteStyle;
  previewQuote?: {
    content: string;
    author: string;
    source?: string;
  };
  onChange: (next: QuoteStyle) => void;
  onClose: () => void;
}

export function StyleEditorDrawer({ open, stylePreset, previewQuote, onChange, onClose }: StyleEditorDrawerProps) {
  if (!open) {
    return null;
  }

  const preview = previewQuote ?? {
    author: "Golden",
    content: "拖动或点选下方选项，实时预览卡片变化。",
    source: "样式预览",
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-stone-950/35 backdrop-blur-sm" onClick={onClose}>
      <div
        className="app-surface app-border mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        data-testid="style-editor-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="app-text font-serif text-xl">卡片样式</h3>
          <button className="app-muted text-sm" onClick={onClose} type="button">
            关闭
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div
            className="app-border overflow-hidden rounded-[2rem] border bg-[#faf6ec] p-5 shadow-[0_18px_40px_rgba(28,25,23,0.08)]"
            data-testid="style-preview-card"
            style={{
              background: stylePreset.background,
              borderRadius: `${stylePreset.borderRadius}px`,
              color: stylePreset.color,
              fontFamily: stylePreset.fontFamily,
              fontSize: `${stylePreset.fontSize}px`,
              fontWeight: stylePreset.fontWeight,
              letterSpacing: `${stylePreset.letterSpacing}em`,
              lineHeight: stylePreset.lineHeight,
              padding: `${Math.max(stylePreset.padding / 2, 20)}px`,
              textAlign: stylePreset.textAlign,
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.28em] opacity-55">{preview.source || "样式预览"}</p>
            <p className="mt-4 text-[1em] leading-[inherit]">{preview.content}</p>
            <p className="mt-4 text-sm opacity-75">— {preview.author}</p>
          </div>

          <div>
            <p className="app-text mb-3 text-sm">背景色</p>
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_PRESETS.map((background) => (
                <button
                  key={background.value}
                  aria-label={`背景色 ${background.name}`}
                  className={cn(
                    "rounded-[1.25rem] border px-3 py-3 text-left text-sm",
                    stylePreset.background === background.value ? "app-button-primary" : "app-input app-text",
                  )}
                  onClick={() =>
                    onChange({
                      ...stylePreset,
                      background: background.value,
                      color: background.value === "#202126" ? "#f5f1e8" : "#1a1a1a",
                    })
                  }
                  type="button"
                >
                  <span className="mb-2 block h-6 w-full rounded-lg border border-black/5" style={{ background: background.value }} />
                  <span>{background.name}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <div className="app-text mb-2 flex items-center justify-between text-sm">
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
            <div className="app-text mb-3 flex items-center justify-between text-sm">
              <p>行高</p>
              <span>{stylePreset.lineHeight.toFixed(1)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {LINE_HEIGHT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs",
                    stylePreset.lineHeight === preset.value ? "app-button-primary" : "app-input app-text",
                  )}
                  onClick={() =>
                    onChange({
                      ...stylePreset,
                      lineHeight: preset.value,
                    })
                  }
                  type="button"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="app-text mb-3 text-sm">字体选择</p>
            <div className="grid grid-cols-2 gap-2">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  className={cn(
                    "rounded-[1.25rem] border px-3 py-3 text-left text-sm",
                    stylePreset.fontFamily === font.value ? "app-button-primary" : "app-input app-text",
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
            <p className="app-text mb-3 text-sm">对齐方式</p>
            <div className="grid grid-cols-3 gap-2">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm",
                    stylePreset.textAlign === align ? "app-button-primary" : "app-input app-text",
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

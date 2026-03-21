import type { QuoteStyle } from '@/types/quote';

export const DEFAULT_QUOTE_STYLE: QuoteStyle = {
  fontSize: 24,
  fontFamily: "'Cormorant Garamond', serif",
  color: '#1a1a1a',
  fontWeight: '400',
  textAlign: 'center',
  background: '#fdfcf0',
  padding: 40,
  borderRadius: 12,
  lineHeight: 1.6,
  letterSpacing: 0.05,
};

export const FONT_FAMILIES = [
  { name: 'Serif (Classic)', value: "'Cormorant Garamond', serif" },
  { name: 'Sans (Modern)', value: "'Inter', sans-serif" },
  { name: 'Mono (Technical)', value: "'JetBrains Mono', monospace" },
  { name: 'Elegant', value: "'Playfair Display', serif" },
] as const;

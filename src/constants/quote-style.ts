import type { QuoteStyle } from "@/types/quote";

export const DEFAULT_QUOTE_STYLE: QuoteStyle = {
  fontSize: 24,
  fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif",
  color: "#1a1a1a",
  fontWeight: "400",
  textAlign: "center",
  background: "#fdfcf0",
  padding: 40,
  borderRadius: 12,
  lineHeight: 1.6,
  letterSpacing: 0.05,
};

export const FONT_FAMILIES = [
  { name: "中文宋体", value: "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif" },
  { name: "中文黑体", value: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { name: "中文楷体", value: "'LXGW WenKai', 'STKaiti', 'KaiTi', serif" },
  { name: "等宽中文", value: "'Sarasa Mono SC', 'JetBrains Mono', 'Microsoft YaHei', monospace" },
] as const;

export const LINE_HEIGHT_PRESETS = [
  { name: "紧凑", value: 1.4 },
  { name: "舒适", value: 1.6 },
  { name: "宽松", value: 1.8 },
  { name: "留白", value: 2.0 },
] as const;

export const BACKGROUND_PRESETS = [
  { name: "米白", value: "#fdfcf0" },
  { name: "暖杏", value: "#f7ead9" },
  { name: "雾蓝", value: "#e8eff5" },
  { name: "竹青", value: "#e7f1ea" },
  { name: "浅灰", value: "#f2f2ee" },
  { name: "夜墨", value: "#202126" },
] as const;

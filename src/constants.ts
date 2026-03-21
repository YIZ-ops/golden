import { QuoteStyle, HitokotoCategory, Quote } from './types';

export const DEFAULT_STYLE: QuoteStyle = {
  fontSize: 24,
  fontFamily: "'Cormorant Garamond', serif",
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
  { name: 'Serif (Classic)', value: "'Cormorant Garamond', serif" },
  { name: 'Sans (Modern)', value: "'Inter', sans-serif" },
  { name: 'Mono (Technical)', value: "'JetBrains Mono', monospace" },
  { name: 'Elegant', value: "'Playfair Display', serif" },
];

export const HITOKOTO_CATEGORIES: HitokotoCategory[] = [
  { id: 'a', name: '动画', description: 'Anime', icon: '🎨' },
  { id: 'b', name: '漫画', description: 'Manga', icon: '📚' },
  { id: 'c', name: '游戏', description: 'Game', icon: '🎮' },
  { id: 'd', name: '文学', description: 'Literature', icon: '✍️' },
  { id: 'e', name: '原创', description: 'Original', icon: '💡' },
  { id: 'f', name: '来自网络', description: 'Internet', icon: '🌐' },
  { id: 'g', name: '其他', description: 'Other', icon: '✨' },
  { id: 'h', name: '影视', description: 'Movie', icon: '🎬' },
  { id: 'i', name: '诗词', description: 'Poetry', icon: '📜' },
  { id: 'j', name: '网易云', description: 'Music', icon: '🎵' },
  { id: 'k', name: '哲学', description: 'Philosophy', icon: '🧠' },
  { id: 'l', name: '抖机灵', description: 'Witty', icon: '😜' },
];

export const AUTHORS = [
  { id: 'luxun', name: '鲁迅', description: '中国现代文学奠基人', avatar: 'https://picsum.photos/seed/luxun/200/200' },
  { id: 'murakami', name: '村上春树', description: '日本现代著名小说家', avatar: 'https://picsum.photos/seed/murakami/200/200' },
  { id: 'sanmao', name: '三毛', description: '中国现代作家', avatar: 'https://picsum.photos/seed/sanmao/200/200' },
  { id: 'dazai', name: '太宰治', description: '日本战后无赖派文学代表作家', avatar: 'https://picsum.photos/seed/dazai/200/200' },
  { id: 'shakespeare', name: '莎士比亚', description: '英国文艺复兴时期剧作家', avatar: 'https://picsum.photos/seed/shakespeare/200/200' },
  { id: 'hugo', name: '维克多·雨果', description: '法国浪漫主义文学代表', avatar: 'https://picsum.photos/seed/hugo/200/200' },
  { id: 'bishumin', name: '毕淑敏', description: '国家一级作家，内科主治医师', avatar: 'https://picsum.photos/seed/bishumin/200/200' },
  { id: 'rolland', name: '罗曼·罗兰', description: '法国思想家、文学家', avatar: 'https://picsum.photos/seed/rolland/200/200' },
  { id: 'kafka', name: '卡夫卡', description: '奥地利现代主义作家', avatar: 'https://picsum.photos/seed/kafka/200/200' },
  { id: 'hemingway', name: '海明威', description: '美国现代著名小说家', avatar: 'https://picsum.photos/seed/hemingway/200/200' },
  { id: 'tolstoy', name: '托尔斯泰', description: '俄国批判现实主义作家', avatar: 'https://picsum.photos/seed/tolstoy/200/200' },
  { id: 'nietzsche', name: '尼采', description: '德国哲学家、诗人', avatar: 'https://picsum.photos/seed/nietzsche/200/200' },
  { id: 'wilde', name: '王尔德', description: '英国唯美主义代表作家', avatar: 'https://picsum.photos/seed/wilde/200/200' },
];

export const SINGERS = [
  { id: 'jay', name: '周杰伦', description: '华语流行乐男歌手', avatar: 'https://picsum.photos/seed/jay/200/200' },
  { id: 'eason', name: '陈奕迅', description: '香港流行乐男歌手', avatar: 'https://picsum.photos/seed/eason/200/200' },
  { id: 'faye', name: '王菲', description: '华语流行乐女歌手', avatar: 'https://picsum.photos/seed/faye/200/200' },
  { id: 'pushu', name: '朴树', description: '中国内地男歌手', avatar: 'https://picsum.photos/seed/pushu/200/200' },
  { id: 'jonathan', name: '李宗盛', description: '华语乐坛教父级人物', avatar: 'https://picsum.photos/seed/jonathan/200/200' },
  { id: 'lo', name: '罗大佑', description: '华语流行乐坛重要创作人', avatar: 'https://picsum.photos/seed/lo/200/200' },
  { id: 'mika', name: '中岛美嘉', description: '日本流行乐女歌手、演员', avatar: 'https://picsum.photos/seed/mika/200/200' },
  { id: 'joker', name: '薛之谦', description: '华语流行乐男歌手', avatar: 'https://picsum.photos/seed/joker/200/200' },
  { id: 'liurong', name: '刘若英', description: '华语流行乐女歌手', avatar: 'https://picsum.photos/seed/liurong/200/200' },
  { id: 'mayday', name: '五月天', description: '台湾摇滚乐团', avatar: 'https://picsum.photos/seed/mayday/200/200' },
  { id: 'sodagreen', name: '苏打绿', description: '台湾流行乐团', avatar: 'https://picsum.photos/seed/sodagreen/200/200' },
  { id: 'jj', name: '林俊杰', description: '华语流行乐男歌手', avatar: 'https://picsum.photos/seed/jj/200/200' },
];

export const INITIAL_QUOTES: Quote[] = [];

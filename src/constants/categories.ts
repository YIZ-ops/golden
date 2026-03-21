import type { HitokotoCategory } from '@/types/quote';

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
  { id: 'luxun', name: '鲁迅', description: '中国现代文学奠基人' },
  { id: 'murakami', name: '村上春树', description: '日本现代著名小说家' },
  { id: 'sanmao', name: '三毛', description: '中国现代作家' },
  { id: 'dazai', name: '太宰治', description: '日本战后无赖派文学代表作家' },
];

export const SINGERS = [
  { id: 'jay', name: '周杰伦', description: '华语流行乐男歌手' },
  { id: 'eason', name: '陈奕迅', description: '香港流行乐男歌手' },
  { id: 'faye', name: '王菲', description: '华语流行乐女歌手' },
  { id: 'pushu', name: '朴树', description: '中国内地男歌手' },
];

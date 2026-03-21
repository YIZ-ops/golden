export interface Quote {
  id: string;
  content: string;
  author: string;
  source?: string;
  category?: string;
  createdBy: string;
  createdAt?: any;
}

export interface Favorite {
  id: string;
  userId: string;
  quoteId: string;
  createdAt: any;
}

export interface Reflection {
  id: string;
  userId: string;
  quoteId: string;
  content: string;
  createdAt: any;
}

export interface Heartbeat {
  id: string;
  userId: string;
  quoteId: string;
  count: number;
  lastLikedAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
}

export type Tab = 'home' | 'categories' | 'favorites' | 'settings';

export interface HitokotoCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface HitokotoResponse {
  id: number;
  uuid: string;
  hitokoto: string;
  type: string;
  from: string;
  from_who: string | null;
  creator: string;
  creator_uid: number;
  reviewer: number;
  commit_from: string;
  created_at: string;
  length: number;
}

export interface QuoteStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  background: string;
  padding: number;
  borderRadius: number;
  lineHeight: number;
  letterSpacing: number;
}

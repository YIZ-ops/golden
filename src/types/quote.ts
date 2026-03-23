import type { PersonRole } from '@/types/person';

export interface QuotePerson {
  id: string;
  name: string;
  role: PersonRole;
}

export interface Quote {
  id: string;
  content: string;
  author: string;
  source?: string;
  category?: string;
  sourceType?: 'seed' | 'hitokoto' | 'manual';
  person?: QuotePerson;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface HitokotoCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

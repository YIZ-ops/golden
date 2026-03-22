import { apiRequest } from '@/services/api/client';
import type { PaginatedResponse, ViewerState } from '@/types/api';
import type { Quote } from '@/types/quote';

export interface GetQuotesParams {
  category?: string;
  authorRole?: 'author' | 'singer' | 'unknown';
  author?: string;
  personId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export type QuoteListItem = Quote & {
  viewerState?: ViewerState;
};

export async function getQuotes(params: GetQuotesParams = {}) {
  const query = buildQueryString(params);
  const path = query ? `/api/quotes?${query}` : '/api/quotes';
  return apiRequest<PaginatedResponse<QuoteListItem>>(path);
}

export async function fetchHitokoto(category?: string) {
  return apiRequest<{ quote: Quote }>('/api/quotes/fetch-hitokoto', {
    method: 'POST',
    body: category ? { category } : {},
  });
}

function buildQueryString(params: GetQuotesParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

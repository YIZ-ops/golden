import { apiRequest } from '@/services/api/client';
import type { PaginatedResponse, ViewerState } from '@/types/api';
import type { Quote } from '@/types/quote';

export interface GetFavoritesParams {
  category?: string;
  page?: number;
  pageSize?: number;
}

export type FavoriteQuote = Quote & {
  viewerState: ViewerState;
};

export async function getFavorites(params: GetFavoritesParams = {}) {
  const query = buildQueryString(params);
  const path = query ? `/api/favorites?${query}` : '/api/favorites';
  return apiRequest<PaginatedResponse<FavoriteQuote>>(path);
}

export async function favoriteQuote(quoteId: string) {
  return apiRequest<{ favorited: true }>(`/api/favorites/${quoteId}`, {
    method: 'POST',
  });
}

export async function unfavoriteQuote(quoteId: string) {
  return apiRequest<{ favorited: false }>(`/api/favorites/${quoteId}`, {
    method: 'DELETE',
  });
}

function buildQueryString(params: GetFavoritesParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

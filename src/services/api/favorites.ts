import { apiRequest } from "@/services/api/client";
import type { PaginatedResponse, ViewerState } from "@/types/api";
import type { QuoteListItem } from "@/services/api/quotes";
import type { Quote } from "@/types/quote";

const FAVORITE_FOLDERS_CACHE_TTL = 30_000;
const FAVORITE_FOLDER_QUOTES_CACHE_TTL = 30_000;

let favoriteFoldersCache: {
  expiresAt: number;
  value: { items: FavoriteFolder[] };
} | null = null;
let favoriteFoldersRequest: Promise<{ items: FavoriteFolder[] }> | null = null;
const favoriteFolderQuotesCache = new Map<string, { expiresAt: number; value: PaginatedResponse<QuoteListItem> }>();
const favoriteFolderQuotesRequests = new Map<string, Promise<PaginatedResponse<QuoteListItem>>>();

export interface GetFavoritesParams {
  category?: string;
  page?: number;
  pageSize?: number;
}

export type FavoriteQuote = Quote & {
  viewerState: ViewerState;
  folderId?: string;
};

export interface FavoriteFolder {
  id: string;
  name: string;
  isDefault: boolean;
  quoteCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function getFavorites(params: GetFavoritesParams = {}) {
  const query = buildQueryString(params);
  const path = query ? `/api/favorites?${query}` : "/api/favorites";
  return apiRequest<PaginatedResponse<FavoriteQuote>>(path);
}

export async function favoriteQuote(quoteId: string, folderId?: string) {
  const result = await apiRequest<{ favorited: true }>("/api/favorites", {
    method: "POST",
    body: {
      quoteId,
      folderId,
    },
  });
  invalidateFavoriteFoldersCache();
  invalidateFavoriteFolderQuotesCache();
  return result;
}

export async function unfavoriteQuote(quoteId: string) {
  const result = await apiRequest<{ favorited: false }>("/api/favorites", {
    method: "DELETE",
    body: {
      quoteId,
    },
  });
  invalidateFavoriteFoldersCache();
  invalidateFavoriteFolderQuotesCache();
  return result;
}

export async function getFavoriteFolders() {
  const now = Date.now();

  if (favoriteFoldersCache && favoriteFoldersCache.expiresAt > now) {
    return favoriteFoldersCache.value;
  }

  if (favoriteFoldersRequest) {
    return favoriteFoldersRequest;
  }

  favoriteFoldersRequest = apiRequest<{ items: FavoriteFolder[] }>("/api/favorites/folders")
    .then((result) => {
      favoriteFoldersCache = {
        expiresAt: Date.now() + FAVORITE_FOLDERS_CACHE_TTL,
        value: result,
      };
      return result;
    })
    .finally(() => {
      favoriteFoldersRequest = null;
    });

  return favoriteFoldersRequest;
}

export async function createFavoriteFolder(name: string) {
  const result = await apiRequest<{ item: FavoriteFolder }>("/api/favorites/folders", {
    method: "POST",
    body: { name },
  });
  invalidateFavoriteFoldersCache();
  invalidateFavoriteFolderQuotesCache();
  return result;
}

export async function renameFavoriteFolder(folderId: string, name: string) {
  const result = await apiRequest<{ item: FavoriteFolder }>("/api/favorites/folders", {
    method: "PATCH",
    body: { folderId, name },
  });
  invalidateFavoriteFoldersCache();
  invalidateFavoriteFolderQuotesCache(folderId);
  return result;
}

export async function deleteFavoriteFolder(folderId: string) {
  const result = await apiRequest<{ deleted: true; movedToFolderId: string }>("/api/favorites/folders", {
    method: "DELETE",
    body: { folderId },
  });
  invalidateFavoriteFoldersCache();
  invalidateFavoriteFolderQuotesCache();
  return result;
}

export async function getFavoriteFolderQuotes(params: { folderId: string; page: number; pageSize: number }) {
  const query = buildQueryString(params);
  const cacheKey = query;
  const now = Date.now();
  const cached = favoriteFolderQuotesCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const pending = favoriteFolderQuotesRequests.get(cacheKey);

  if (pending) {
    return pending;
  }

  const request = apiRequest<PaginatedResponse<QuoteListItem>>(`/api/favorites/folders/quotes?${query}`)
    .then((result) => {
      favoriteFolderQuotesCache.set(cacheKey, {
        expiresAt: Date.now() + FAVORITE_FOLDER_QUOTES_CACHE_TTL,
        value: result,
      });
      return result;
    })
    .finally(() => {
      favoriteFolderQuotesRequests.delete(cacheKey);
    });

  favoriteFolderQuotesRequests.set(cacheKey, request);
  return request;
}

function buildQueryString(params: GetFavoritesParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

function invalidateFavoriteFoldersCache() {
  favoriteFoldersCache = null;
  favoriteFoldersRequest = null;
}

export function invalidateFavoriteFolderQuotesCache(folderId?: string) {
  if (!folderId) {
    favoriteFolderQuotesCache.clear();
    favoriteFolderQuotesRequests.clear();
    return;
  }

  for (const key of favoriteFolderQuotesCache.keys()) {
    if (key.includes(`folderId=${encodeURIComponent(folderId)}`)) {
      favoriteFolderQuotesCache.delete(key);
    }
  }

  for (const key of favoriteFolderQuotesRequests.keys()) {
    if (key.includes(`folderId=${encodeURIComponent(folderId)}`)) {
      favoriteFolderQuotesRequests.delete(key);
    }
  }
}

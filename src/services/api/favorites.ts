import { apiRequest } from "@/services/api/client";
import type { PaginatedResponse, ViewerState } from "@/types/api";
import type { QuoteListItem } from "@/services/api/quotes";
import type { Quote } from "@/types/quote";

const FAVORITE_FOLDERS_CACHE_TTL = 30_000;

let favoriteFoldersCache:
  | {
      expiresAt: number;
      value: { items: FavoriteFolder[] };
    }
  | null = null;
let favoriteFoldersRequest: Promise<{ items: FavoriteFolder[] }> | null = null;

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
  return result;
}

export async function renameFavoriteFolder(folderId: string, name: string) {
  const result = await apiRequest<{ item: FavoriteFolder }>("/api/favorites/folders", {
    method: "PATCH",
    body: { folderId, name },
  });
  invalidateFavoriteFoldersCache();
  return result;
}

export async function deleteFavoriteFolder(folderId: string) {
  const result = await apiRequest<{ deleted: true; movedToFolderId: string }>("/api/favorites/folders", {
    method: "DELETE",
    body: { folderId },
  });
  invalidateFavoriteFoldersCache();
  return result;
}

export async function getFavoriteFolderQuotes(params: { folderId: string; page: number; pageSize: number }) {
  const query = buildQueryString(params);
  return apiRequest<PaginatedResponse<QuoteListItem>>(`/api/favorites/folders/quotes?${query}`);
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

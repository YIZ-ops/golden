import { apiRequest } from "@/services/api/client";
import { getAccessToken } from "@/services/supabase/session";
import type { PaginatedResponse, ViewerState } from "@/types/api";
import type { Quote } from "@/types/quote";

const QUOTES_CACHE_TTL = 30_000;

const quotesCache = new Map<string, { expiresAt: number; value: PaginatedResponse<QuoteListItem> }>();
const quotesRequests = new Map<string, Promise<PaginatedResponse<QuoteListItem>>>();

export interface GetQuotesParams {
  category?: string;
  author?: string;
  personId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export type QuoteListItem = Quote & {
  viewerState?: ViewerState;
};

export async function getHomeQuotes(limit = 5, excludeIds: string[] = []) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  if (excludeIds.length > 0) {
    params.set("excludeIds", excludeIds.join(","));
  }

  return apiRequest<{ items: QuoteListItem[] }>(`/api/home/quotes?${params.toString()}`);
}

export async function getQuotes(params: GetQuotesParams = {}) {
  const token = (await getAccessToken()) ?? "anonymous";
  const query = buildQueryString(params);
  const cacheKey = `${token}::${query}`;
  const now = Date.now();
  const cached = quotesCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const pending = quotesRequests.get(cacheKey);

  if (pending) {
    return pending;
  }

  const path = query ? `/api/quotes?${query}` : "/api/quotes";
  const request = apiRequest<PaginatedResponse<QuoteListItem>>(path)
    .then((result) => {
      quotesCache.set(cacheKey, {
        expiresAt: Date.now() + QUOTES_CACHE_TTL,
        value: result,
      });
      return result;
    })
    .finally(() => {
      quotesRequests.delete(cacheKey);
    });

  quotesRequests.set(cacheKey, request);
  return request;
}

export async function fetchHitokoto(category?: string) {
  return apiRequest<{ quote: Quote }>("/api/quotes/fetch-hitokoto", {
    method: "POST",
    body: category ? { category } : {},
  });
}

export async function createQuote(input: { content: string; author: string; source?: string; category?: string }) {
  const result = await apiRequest<{ quote: Quote }>("/api/quotes", {
    method: "POST",
    body: input,
  });

  invalidateQuotesCache();
  return result;
}

export async function updateQuote(input: { quoteId: string; content: string; author: string; source?: string; category?: string }) {
  const result = await apiRequest<{ quote: Quote }>("/api/quotes", {
    method: "PATCH",
    body: input,
  });

  invalidateQuotesCache();
  return result;
}

export async function deleteQuote(quoteId: string) {
  const result = await apiRequest<{ deleted: true; quoteId: string }>("/api/quotes", {
    method: "DELETE",
    body: { quoteId },
  });

  invalidateQuotesCache();
  return result;
}

export function invalidateQuotesCache() {
  quotesCache.clear();
  quotesRequests.clear();
}

function buildQueryString(params: GetQuotesParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

import { useCallback, useEffect, useRef, useState } from "react";

import { getPeople, type GetPeopleParams } from "@/services/api/people";
import type { PersonListItem } from "@/types/person";

interface PeopleCacheState {
  data: PersonListItem[] | null;
  timestamp: number;
  loading: boolean;
  error: string | null;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Cache storage for different queries
const cacheStore = new Map<string, PeopleCacheState>();

interface UsePeopleCacheOptions {
  fetchAll?: boolean;
}

function getCacheKey(params: GetPeopleParams, options: UsePeopleCacheOptions): string {
  if (options.fetchAll) {
    return `${params.role}:${params.keyword || ""}:all:${params.pageSize || 50}`;
  }

  return `${params.role}:${params.keyword || ""}:${params.page || 1}:${params.pageSize || 20}`;
}

export function usePeopleCache(params: GetPeopleParams, options: UsePeopleCacheOptions = {}) {
  const [cacheState, setCacheState] = useState<PeopleCacheState>({
    data: null,
    timestamp: 0,
    loading: false,
    error: null,
  });

  const isFirstLoadRef = useRef(true);
  const cacheKeyRef = useRef(getCacheKey(params, options));

  const loadPeople = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = getCacheKey(params, options);
      cacheKeyRef.current = cacheKey;

      // Check if cache is still valid
      const now = Date.now();
      const cachedData = cacheStore.get(cacheKey);
      const isCacheValid = !forceRefresh && cachedData && now - cachedData.timestamp < CACHE_DURATION_MS;

      if (isCacheValid && !isFirstLoadRef.current) {
        // Use cached data without loading
        setCacheState(cachedData);
        return;
      }

      isFirstLoadRef.current = false;

      setCacheState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        let items: PersonListItem[] = [];

        if (options.fetchAll) {
          const firstPage = params.page ?? 1;
          const pageSize = params.pageSize ?? 50;
          let page = firstPage;
          let total = 0;
          const existingIds = new Set<string>();

          while (true) {
            const response = await getPeople({ ...params, page, pageSize });
            const merged = response.items.filter((item) => !existingIds.has(item.id));
            merged.forEach((item) => {
              existingIds.add(item.id);
            });
            items = [...items, ...merged];
            total = response.total;

            if (total <= 0 || page * pageSize >= total) {
              break;
            }

            page += 1;
          }
        } else {
          const result = await getPeople(params);
          items = result.items;
        }

        const now = Date.now();
        const newState: PeopleCacheState = {
          data: items,
          timestamp: now,
          loading: false,
          error: null,
        };

        cacheStore.set(cacheKey, newState);
        setCacheState(newState);
      } catch (requestError) {
        const errorMessage = requestError instanceof Error ? requestError.message : "获取数据失败。";

        const errorState: PeopleCacheState = {
          data: null,
          timestamp: 0,
          loading: false,
          error: errorMessage,
        };

        setCacheState(errorState);
      }
    },
    [options, params],
  );

  // Initial load on mount or params change
  useEffect(() => {
    if (isFirstLoadRef.current) {
      void loadPeople();
    }
  }, [params, loadPeople]);

  const refreshPeople = useCallback(async () => {
    await loadPeople(true); // Force refresh
  }, [loadPeople]);

  const clearCache = useCallback(() => {
    cacheStore.delete(cacheKeyRef.current);
    setCacheState({
      data: null,
      timestamp: 0,
      loading: false,
      error: null,
    });
  }, []);

  return {
    people: cacheState.data ?? [],
    loading: cacheState.loading,
    error: cacheState.error,
    refresh: refreshPeople,
    clearCache,
  };
}

// Export helper to clear all people cache
export function clearAllPeopleCache() {
  cacheStore.clear();
}

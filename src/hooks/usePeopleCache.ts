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

function getCacheKey(params: GetPeopleParams): string {
  return `${params.role}:${params.keyword || ""}:${params.page || 1}`;
}

export function usePeopleCache(params: GetPeopleParams) {
  const [cacheState, setCacheState] = useState<PeopleCacheState>({
    data: null,
    timestamp: 0,
    loading: false,
    error: null,
  });

  const isFirstLoadRef = useRef(true);
  const cacheKeyRef = useRef(getCacheKey(params));

  const loadPeople = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = getCacheKey(params);
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
        const result = await getPeople(params);
        const now = Date.now();
        const newState: PeopleCacheState = {
          data: result.items,
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
        throw requestError;
      }
    },
    [params],
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

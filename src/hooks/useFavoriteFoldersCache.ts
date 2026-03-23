import { useCallback, useEffect, useRef, useState } from "react";

import { getFavoriteFolders, type FavoriteFolder } from "@/services/api/favorites";
import { ApiClientError } from "@/services/api/client";

interface CacheState {
  data: FavoriteFolder[] | null;
  timestamp: number;
  loading: boolean;
  error: string | null;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function useFavoriteFoldersCache(userId: string | undefined) {
  const [cacheState, setCacheState] = useState<CacheState>({
    data: null,
    timestamp: 0,
    loading: false,
    error: null,
  });

  const isFirstLoadRef = useRef(true);

  const loadFolders = useCallback(
    async (forceRefresh = false) => {
      if (!userId) {
        setCacheState({
          data: [],
          timestamp: 0,
          loading: false,
          error: null,
        });
        return;
      }

      // Check if cache is still valid
      const now = Date.now();
      const isCacheValid = !forceRefresh && cacheState.data !== null && now - cacheState.timestamp < CACHE_DURATION_MS;

      if (isCacheValid && !isFirstLoadRef.current) {
        // Use cached data without loading
        return;
      }

      isFirstLoadRef.current = false;

      setCacheState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const result = await getFavoriteFolders();
        const now = Date.now();
        setCacheState({
          data: result.items,
          timestamp: now,
          loading: false,
          error: null,
        });
      } catch (requestError) {
        const errorMessage =
          requestError instanceof ApiClientError ? requestError.message : requestError instanceof Error ? requestError.message : "获取收藏夹失败。";

        setCacheState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        throw requestError;
      }
    },
    [userId, cacheState.data, cacheState.timestamp],
  );

  // Initial load on mount or user change
  useEffect(() => {
    if (userId && isFirstLoadRef.current) {
      void loadFolders();
    }
  }, [userId, loadFolders]);

  const refreshFolders = useCallback(async () => {
    await loadFolders(true); // Force refresh
  }, [loadFolders]);

  return {
    folders: cacheState.data ?? [],
    loading: cacheState.loading,
    error: cacheState.error,
    refresh: refreshFolders,
  };
}

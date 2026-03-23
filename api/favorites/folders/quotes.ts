import { createUnauthorizedErrorResponse, getUserIdFromJwt, isAuthFailure, requireBearerToken } from "../../_lib/auth.js";
import { badRequest, internalError, unauthorized } from "../../_lib/http.js";
import { createUserServerClient } from "../../_lib/supabase.js";
import { successResponse } from "../../_lib/http.js";
import { getViewerStateMap } from "../../quotes/viewer-state.js";
import { getFolderById, parsePagination, readQueryValue } from "../folders-shared.js";

interface FavoriteRow {
  quote_id: string;
  created_at?: string | null;
  folder_id?: string | null;
  quotes:
    | {
        id: string;
        content: string;
        author: string;
        category?: string | null;
        source?: string | null;
        source_type?: string | null;
        created_at?: string | null;
      }
    | {
        id: string;
        content: string;
        author: string;
        category?: string | null;
        source?: string | null;
        source_type?: string | null;
        created_at?: string | null;
      }[]
    | null;
}

export async function GET(request: Request) {
  try {
    const token = requireBearerToken(request.headers.get("Authorization"));

    if (isAuthFailure(token)) {
      return createUnauthorizedErrorResponse(token);
    }

    const userClient = createUserServerClient(token);
    const userId = getUserIdFromJwt(token);

    if (!userId) {
      return unauthorized("当前登录凭证无效，请重新登录。", "INVALID_TOKEN");
    }

    const url = new URL(request.url);
    const folderId = readQueryValue(url.searchParams.get("folderId"));

    if (!folderId) {
      return badRequest("folderId 不能为空。", "INVALID_FOLDER_ID");
    }

    const pagination = parsePagination(url);

    if (pagination instanceof Response) {
      return pagination;
    }

    const folder = await getFolderById(userClient, userId, folderId);

    if (!folder) {
      return badRequest("收藏夹不存在。", "FOLDER_NOT_FOUND");
    }

    const rangeStart = (pagination.page - 1) * pagination.pageSize;
    const rangeEnd = rangeStart + pagination.pageSize - 1;

    const { data: favoriteRows, count, error: favoriteError } = await userClient
      .from("favorites")
      .select("quote_id, folder_id, created_at, quotes(id, content, author, category, source, source_type, created_at)", { count: "exact" })
      .eq("user_id", userId)
      .eq("folder_id", folder.id)
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd);

    if (favoriteError) {
      throw favoriteError;
    }

    const normalizedRows = ((favoriteRows ?? []) as FavoriteRow[])
      .map((row) => ({
        quote_id: row.quote_id,
        created_at: row.created_at,
        folder_id: row.folder_id,
        quotes: getSingleQuote(row.quotes),
      }))
      .filter((row) => row.quotes);

    const viewerStateMap = await getViewerStateMap(
      userClient,
      userId,
      normalizedRows.map((row) => row.quote_id),
    );

    const items = normalizedRows.map((row) => ({
      id: row.quotes!.id,
      content: row.quotes!.content,
      author: row.quotes!.author,
      category: row.quotes!.category ?? undefined,
      source: row.quotes!.source ?? undefined,
      sourceType: normalizeSourceType(row.quotes!.source_type),
      createdAt: row.quotes!.created_at ?? undefined,
      viewerState: {
        isFavorited: true,
        viewerHeartbeatCount: viewerStateMap.heartbeatMap.get(row.quote_id) ?? 0,
      },
      folderId: row.folder_id ?? folder.id,
    }));

    return successResponse({
      items,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: count ?? items.length,
    });
  } catch (error) {
    console.error("GET /api/favorites/folders/quotes failed", error);
    return internalError("获取收藏夹列表失败。", "FAVORITE_FOLDER_QUOTES_FAILED");
  }
}

function normalizeSourceType(value?: string | null) {
  if (value === "seed" || value === "hitokoto" || value === "manual") {
    return value;
  }

  return undefined;
}

function getSingleQuote(row: FavoriteRow["quotes"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

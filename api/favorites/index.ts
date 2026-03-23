import { createUnauthorizedErrorResponse, getUserIdFromJwt, isAuthFailure, requireBearerToken } from "../_lib/auth.js";
import { badRequest, internalError, notFound, successResponse, unauthorized } from "../_lib/http.js";
import { createUserServerClient } from "../_lib/supabase.js";
import { ensureDefaultFolder, getFolderById, readQueryValue } from "./folders-shared.js";
import { getViewerStateMap } from "../quotes/viewer-state.js";

interface FavoriteRow {
  quote_id: string;
  folder_id?: string | null;
  created_at?: string | null;
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

    const defaultFolder = await ensureDefaultFolder(userClient, userId);

    const parsed = parseFavoritesQuery(new URL(request.url));

    if ("code" in parsed) {
      return badRequest(parsed.message, parsed.code);
    }

    let folderFilterId: string | null = null;

    if (parsed.folderId) {
      const folder = await getFolderById(userClient, userId, parsed.folderId);

      if (!folder) {
        return badRequest("收藏夹不存在。", "FOLDER_NOT_FOUND");
      }

      folderFilterId = folder.id;
    }

    const query = userClient
      .from("favorites")
      .select("quote_id, folder_id, created_at, quotes(id, content, author, category, source, source_type, created_at)")
      .eq("user_id", userId);

    const { data: favoriteRows, error: favoriteError } = await query.order("created_at", { ascending: false });

    if (favoriteError) {
      throw favoriteError;
    }

    const normalizedRows = ((favoriteRows ?? []) as FavoriteRow[])
      .map((row) => ({
        quote_id: row.quote_id,
        folder_id: row.folder_id,
        created_at: row.created_at,
        quotes: getSingleQuote(row.quotes),
      }))
      .filter((row) => row.quotes);

    const filtered = normalizedRows.filter((row) => {
      const categoryMatched = parsed.category ? row.quotes?.category === parsed.category : true;
      const folderMatched = folderFilterId ? (row.folder_id ?? defaultFolder.id) === folderFilterId : true;
      return categoryMatched && folderMatched;
    });

    const total = filtered.length;
    const rangeStart = (parsed.page - 1) * parsed.pageSize;
    const pagedRows = filtered.slice(rangeStart, rangeStart + parsed.pageSize);
    const viewerStateMap = await getViewerStateMap(
      userClient,
      userId,
      pagedRows.map((row) => row.quote_id),
    );
    const pagedItems = pagedRows.map((row) => ({
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
    }));

    return successResponse({
      items: pagedItems,
      page: parsed.page,
      pageSize: parsed.pageSize,
      total,
    });
  } catch (error) {
    console.error("GET /api/favorites failed", error);
    return internalError("获取收藏列表失败。", "FAVORITES_LIST_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authenticateMutationRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId, quoteId } = authResult;
    const targetFolderId = await resolveFolderId(request, userClient, userId);

    if (targetFolderId instanceof Response) {
      return targetFolderId;
    }

    const quote = await findQuote(userClient, quoteId);

    if (!quote) {
      return notFound("金句不存在。", "QUOTE_NOT_FOUND");
    }

    const { error } = await userClient.from("favorites").upsert(
      {
        user_id: userId,
        quote_id: quoteId,
        folder_id: targetFolderId,
      },
      {
        onConflict: "user_id,quote_id",
      },
    );

    if (error) {
      throw error;
    }

    return successResponse({ favorited: true });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("POST /api/favorites failed", error);
    return internalError("收藏金句失败。", "FAVORITE_CREATE_FAILED");
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await authenticateMutationRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId, quoteId } = authResult;
    const deleteQuery = userClient.from("favorites").delete().eq("user_id", userId);
    const { error } = await deleteQuery.eq("quote_id", quoteId);

    if (error) {
      throw error;
    }

    return successResponse({ favorited: false });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("DELETE /api/favorites failed", error);
    return internalError("取消收藏失败。", "FAVORITE_DELETE_FAILED");
  }
}

function parseFavoritesQuery(url: URL) {
  const category = readQueryValue(url.searchParams.get("category"));
  const folderId = readQueryValue(url.searchParams.get("folderId"));
  const page = Number(readQueryValue(url.searchParams.get("page")) ?? "1");
  const pageSize = Number(readQueryValue(url.searchParams.get("pageSize")) ?? "20");

  if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page < 1 || pageSize < 1 || pageSize > 50) {
    return {
      message: "分页参数无效，page 必须大于等于 1，pageSize 必须在 1 到 50 之间。",
      code: "INVALID_PAGINATION",
    };
  }

  return {
    category,
    folderId,
    page,
    pageSize,
  };
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

async function authenticateMutationRequest(request: Request) {
  const token = requireBearerToken(request.headers.get("Authorization"));

  if (isAuthFailure(token)) {
    return createUnauthorizedErrorResponse(token);
  }

  const quoteId = await readQuoteId(request);

  if (!quoteId) {
    return badRequest("quoteId 不能为空。", "INVALID_QUOTE_ID");
  }

  const userClient = createUserServerClient(token);
  const userId = getUserIdFromJwt(token);

  if (!userId) {
    return unauthorized("当前登录凭证无效，请重新登录。", "INVALID_TOKEN");
  }

  return {
    userClient,
    userId,
    quoteId,
  };
}

async function readQuoteId(request: Request) {
  try {
    const body = (await request.clone().json()) as { quoteId?: unknown };
    return typeof body.quoteId === "string" && body.quoteId.trim() ? body.quoteId.trim() : null;
  } catch {
    return null;
  }
}

async function resolveFolderId(request: Request, userClient: any, userId: string) {
  const defaultFolder = await ensureDefaultFolder(userClient, userId);

  try {
    const body = (await request.clone().json()) as { folderId?: unknown };
    const folderId = typeof body.folderId === "string" && body.folderId.trim() ? body.folderId.trim() : null;

    if (!folderId) {
      return defaultFolder.id;
    }

    const folder = await getFolderById(userClient, userId, folderId);

    if (!folder) {
      return badRequest("收藏夹不存在。", "FOLDER_NOT_FOUND");
    }

    return folder.id;
  } catch {
    return defaultFolder.id;
  }
}

async function findQuote(userClient: any, quoteId: string) {
  const { data, error } = await userClient.from("quotes").select("id").eq("id", quoteId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

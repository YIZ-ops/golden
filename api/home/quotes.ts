import { createUnauthorizedErrorResponse, getOptionalBearerToken, getUserIdFromJwt, isAuthFailure } from "../_lib/auth.js";
import { badRequest, internalError, successResponse, unauthorized } from "../_lib/http.js";
import { createAnonServerClient, createUserServerClient } from "../_lib/supabase.js";
import { normalizeQuoteRecord, type CanonicalQuoteRow } from "../quotes/ingest.js";
import { getViewerStateMap } from "../quotes/viewer-state.js";

interface QuoteRow extends CanonicalQuoteRow {}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const MAX_EXCLUDED_IDS = 50;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const maybeToken = getOptionalBearerToken(authHeader);

    if (isAuthFailure(maybeToken)) {
      return createUnauthorizedErrorResponse(maybeToken);
    }

    const parsed = parseLimit(new URL(request.url));

    if ("code" in parsed) {
      return badRequest(parsed.message, parsed.code);
    }

    let currentUserId: string | null = null;
    let queryClient = createAnonServerClient();
    let userClient: ReturnType<typeof createUserServerClient> | null = null;

    if (typeof maybeToken === "string") {
      userClient = createUserServerClient(maybeToken);
      const userId = getUserIdFromJwt(maybeToken);

      if (!userId) {
        return unauthorized("当前登录凭证无效，请重新登录。", "INVALID_TOKEN");
      }

      currentUserId = userId;
      queryClient = userClient;
    }

    const localQuotes = await loadLocalQuotes(queryClient, parsed.limit, parsed.excludeIds);
    const viewerStateMap =
      currentUserId && userClient
        ? await getViewerStateMap(
            userClient,
            currentUserId,
            localQuotes.map((item) => item.id),
          )
        : null;
    const items = localQuotes.map((item) => normalizeRow(item, currentUserId, viewerStateMap));

    return successResponse({ items });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("GET /api/home/quotes failed", error);
    return internalError("获取首页金句失败。", "HOME_QUOTES_FAILED");
  }
}

async function loadLocalQuotes(
  queryClient: ReturnType<typeof createAnonServerClient> | ReturnType<typeof createUserServerClient>,
  limit: number,
  excludeIds: string[],
) {
  const result = await queryClient.rpc("random_home_quotes", {
    limit_count: limit,
    excluded_ids: excludeIds,
  });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as QuoteRow[];
}

function normalizeRow(row: QuoteRow, currentUserId: string | null, viewerStateMap: Awaited<ReturnType<typeof getViewerStateMap>> | null) {
  const normalized = normalizeQuoteRecord(row);

  if (!currentUserId || !viewerStateMap) {
    return normalized;
  }

  return {
    ...normalized,
    viewerState: {
      isFavorited: viewerStateMap.favoriteSet.has(row.id),
      viewerHeartbeatCount: viewerStateMap.heartbeatMap.get(row.id) ?? 0,
    },
  };
}

function parseLimit(url: URL) {
  const raw = url.searchParams.get("limit")?.trim();
  const limit = raw ? Number(raw) : DEFAULT_LIMIT;
  const excludeIds = parseExcludeIds(url.searchParams.get("excludeIds"));

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return {
      message: `limit 参数无效，必须在 1 到 ${MAX_LIMIT} 之间。`,
      code: "INVALID_LIMIT",
    };
  }

  return { limit, excludeIds };
}

function parseExcludeIds(raw: string | null) {
  if (!raw) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_EXCLUDED_IDS),
    ),
  );
}

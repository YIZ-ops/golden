import {
  createUnauthorizedErrorResponse,
  getOptionalBearerToken,
  getUserIdFromJwt,
  isAuthFailure,
  requireBearerToken,
} from "../_lib/auth.js";
import { badRequest, internalError, successResponse, unauthorized } from "../_lib/http.js";
import { createAnonServerClient, createUserServerClient } from "../_lib/supabase.js";
import { getViewerStateMap } from "./viewer-state.js";
import { isQueryValidationError, parseQuoteQuery } from "./query.js";

interface QuoteRow {
  id: string;
  content: string;
  author: string;
  author_role?: string;
  person_id?: string | null;
  category?: string | null;
  source?: string | null;
  source_type?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  people?: {
    id: string;
    name: string;
    role: "author" | "singer";
  } | null;
}

export async function POST(request: Request) {
  try {
    const authResult = await authenticateWriteRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await readJson(request);
    const input = parseQuoteCreate(body);

    if ("code" in input) {
      return badRequest(input.message, input.code);
    }

    const { data, error } = await authResult.userClient
      .from("quotes")
      .insert({
        content: input.content,
        author: input.author,
        source: input.source,
        category: input.category,
        source_type: "manual",
        author_role: "unknown",
        created_by: authResult.user.id,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return successResponse({
      quote: normalizeQuoteRow(data),
    });
  } catch (error) {
    console.error("POST /api/quotes failed", error);
    return internalError("创建句子失败。", "QUOTE_CREATE_FAILED");
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const maybeToken = getOptionalBearerToken(authHeader);

    if (isAuthFailure(maybeToken)) {
      return createUnauthorizedErrorResponse(maybeToken);
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

    const parsed = parseQuoteQuery(new URL(request.url));

    if (isQueryValidationError(parsed)) {
      return badRequest(parsed.message, parsed.code);
    }

    const rangeStart = (parsed.page - 1) * parsed.pageSize;
    const rangeEnd = rangeStart + parsed.pageSize - 1;

    let query = queryClient
      .from("quotes")
      .select("*, people(id, name, role)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (parsed.category) {
      query = query.eq("category", parsed.category);
    }

    if (parsed.authorRole) {
      query = query.eq("author_role", parsed.authorRole);
    }

    if (parsed.author) {
      query = query.eq("author", parsed.author);
    }

    if (parsed.personId) {
      query = query.eq("person_id", parsed.personId);
    }

    if (parsed.keyword) {
      query = query.ilike("content", `%${parsed.keyword}%`);
    }

    const { data, count, error } = await query.range(rangeStart, rangeEnd);

    if (error) {
      throw error;
    }

    const viewerStateMap =
      currentUserId && userClient
        ? await getViewerStateMap(
            userClient,
            currentUserId,
            (data ?? []).map((item: QuoteRow) => item.id),
          )
        : null;

    const items = (data ?? []).map((item: QuoteRow) => {
      const normalized = normalizeQuoteRow(item);

      if (!currentUserId || !viewerStateMap) {
        return normalized;
      }

      return {
        ...normalized,
        viewerState: {
          isFavorited: viewerStateMap.favoriteSet.has(item.id),
          viewerHeartbeatCount: viewerStateMap.heartbeatMap.get(item.id) ?? 0,
        },
      };
    });

    return successResponse({
      items,
      page: parsed.page,
      pageSize: parsed.pageSize,
      total: count ?? items.length,
    });
  } catch (error) {
    console.error("GET /api/quotes failed", error);
    return internalError("获取金句列表失败。", "QUOTE_LIST_FAILED");
  }
}

async function authenticateWriteRequest(request: Request) {
  const token = requireBearerToken(request.headers.get("Authorization"));

  if (isAuthFailure(token)) {
    return createUnauthorizedErrorResponse(token);
  }

  const userClient = createUserServerClient(token);
  const { data, error } = await userClient.auth.getUser(token);

  if (error || !data.user) {
    return unauthorized("当前登录凭证无效，请重新登录。", "INVALID_TOKEN");
  }

  return {
    userClient,
    user: data.user,
  };
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseQuoteCreate(body: Record<string, unknown>) {
  const content = readRequiredString(body.content);
  const author = readRequiredString(body.author);
  const source = readOptionalString(body.source);
  const category = readOptionalString(body.category);

  if (content === INVALID_CREATE_VALUE || author === INVALID_CREATE_VALUE || source === INVALID_CREATE_VALUE || category === INVALID_CREATE_VALUE) {
    return {
      message: "quote create 参数无效。",
      code: "INVALID_QUOTE_CREATE",
    };
  }

  if (!content || !author) {
    return {
      message: "quote create 参数无效。",
      code: "INVALID_QUOTE_CREATE",
    };
  }

  return {
    content,
    author,
    source,
    category,
  };
}

const INVALID_CREATE_VALUE = Symbol("INVALID_CREATE_VALUE");

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return INVALID_CREATE_VALUE;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function readOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return INVALID_CREATE_VALUE;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeQuoteRow(item: QuoteRow | null | undefined) {
  return {
    id: item?.id,
    content: item?.content,
    author: item?.author,
    category: item?.category ?? undefined,
    source: item?.source ?? undefined,
    sourceType: normalizeSourceType(item?.source_type),
    createdBy: item?.created_by ?? undefined,
    createdAt: item?.created_at ?? undefined,
    person: item?.people
      ? {
          id: item.people.id,
          name: item.people.name,
          role: item.people.role,
        }
      : undefined,
  };
}

function normalizeSourceType(value?: string | null) {
  if (value === "seed" || value === "hitokoto" || value === "manual") {
    return value;
  }

  return undefined;
}

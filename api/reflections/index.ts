import { createUnauthorizedErrorResponse, getUserIdFromJwt, isAuthFailure, requireBearerToken } from "../_lib/auth";
import { badRequest, internalError, notFound, successResponse, unauthorized } from "../_lib/http";
import { createUserServerClient } from "../_lib/supabase";

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const quoteId = readQueryParam(new URL(request.url), "quoteId");

    if (!quoteId) {
      return badRequest("缺少 quoteId。", "MISSING_QUOTE_ID");
    }

    const query = authResult.userClient.from("reflections").select("*").eq("user_id", authResult.user.id);
    const { data, error } = await query.eq("quote_id", quoteId).order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return successResponse({
      items: (data ?? []).map(normalizeReflection),
    });
  } catch (error) {
    console.error("GET /api/reflections failed", error);
    return internalError("获取感悟列表失败。", "REFLECTION_LIST_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await readJson(request);
    const quoteId = readBodyString(body.quoteId);
    const content = readBodyString(body.content);

    if (!quoteId || !content) {
      return badRequest("quoteId 和 content 都是必填项。", "INVALID_REFLECTION_PAYLOAD");
    }

    const quote = await authResult.userClient.from("quotes").select("id").eq("id", quoteId).maybeSingle();

    if (quote.error) {
      throw quote.error;
    }

    if (!quote.data) {
      return notFound("金句不存在。", "QUOTE_NOT_FOUND");
    }

    const insertQuery = authResult.userClient.from("reflections").insert({
      user_id: authResult.user.id,
      quote_id: quoteId,
      content,
    });
    const { data, error } = await insertQuery.select("*").maybeSingle();

    if (error) {
      throw error;
    }

    return successResponse({
      reflection: normalizeReflection(data),
    });
  } catch (error) {
    console.error("POST /api/reflections failed", error);
    return internalError("创建感悟失败。", "REFLECTION_CREATE_FAILED");
  }
}

async function authenticateRequest(request: Request) {
  const token = requireBearerToken(request.headers.get("Authorization"));

  if (isAuthFailure(token)) {
    return createUnauthorizedErrorResponse(token);
  }

  const userClient = createUserServerClient(token);
  const userId = getUserIdFromJwt(token);

  if (!userId) {
    return unauthorized("当前登录凭证无效，请重新登录。", "INVALID_TOKEN");
  }

  return {
    userClient,
    user: {
      id: userId,
    },
  };
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readQueryParam(url: URL, key: string) {
  const value = url.searchParams.get(key);
  return value?.trim() ? value.trim() : null;
}

function readBodyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeReflection(item: any) {
  return {
    id: item?.id,
    quoteId: item?.quote_id,
    userId: item?.user_id,
    content: item?.content,
    createdAt: item?.created_at,
  };
}

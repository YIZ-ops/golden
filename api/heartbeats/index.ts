import { createUnauthorizedErrorResponse, getUserIdFromJwt, isAuthFailure, requireBearerToken } from "../_lib/auth.js";
import { badRequest, internalError, notFound, successResponse, unauthorized } from "../_lib/http.js";
import { createUserServerClient } from "../_lib/supabase.js";

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId, quoteId } = authResult;
    const quote = await findQuote(userClient, quoteId);

    if (!quote) {
      return notFound("金句不存在。", "QUOTE_NOT_FOUND");
    }

    const existing = await findHeartbeat(userClient, userId, quoteId);
    const nextCount = (existing?.count ?? 0) + 1;

    if (existing) {
      const updateQuery = userClient.from("heartbeats").update({
        count: nextCount,
        last_liked_at: new Date().toISOString(),
      });
      const { error } = await updateQuery.eq("id", existing.id).eq("user_id", userId);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await userClient.from("heartbeats").insert({
        user_id: userId,
        quote_id: quoteId,
        count: nextCount,
        last_liked_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }
    }

    return successResponse({
      quoteId,
      count: nextCount,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("POST /api/heartbeats failed", error);
    return internalError("记录心动失败。", "HEARTBEAT_CREATE_FAILED");
  }
}

async function authenticateRequest(request: Request) {
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
    const body = (await request.json()) as { quoteId?: unknown };
    return typeof body.quoteId === "string" && body.quoteId.trim() ? body.quoteId.trim() : null;
  } catch {
    return null;
  }
}

async function findQuote(userClient: any, quoteId: string) {
  const { data, error } = await userClient.from("quotes").select("id").eq("id", quoteId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function findHeartbeat(userClient: any, userId: string, quoteId: string) {
  const { data, error } = await userClient.from("heartbeats").select("id, count").eq("user_id", userId).eq("quote_id", quoteId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

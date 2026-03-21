import { createUnauthorizedErrorResponse, isAuthFailure, requireBearerToken } from '../_lib/auth';
import { internalError, notFound, successResponse, unauthorized } from '../_lib/http';
import { createUserServerClient } from '../_lib/supabase';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId, quoteId } = authResult;
    const quote = await findQuote(userClient, quoteId);

    if (!quote) {
      return notFound('金句不存在。', 'QUOTE_NOT_FOUND');
    }

    const existing = await findHeartbeat(userClient, userId, quoteId);
    const nextCount = (existing?.count ?? 0) + 1;

    if (existing) {
      const updateQuery = userClient.from('heartbeats').update({
        count: nextCount,
        last_liked_at: new Date().toISOString(),
      });
      const { error } = await updateQuery.eq('id', existing.id).eq('user_id', userId);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await userClient.from('heartbeats').insert({
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
    console.error('POST /api/heartbeats/:quoteId failed', error);
    return internalError('记录心动失败。', 'HEARTBEAT_CREATE_FAILED');
  }
}

async function authenticateRequest(request: Request) {
  const token = requireBearerToken(request.headers.get('Authorization'));

  if (isAuthFailure(token)) {
    return createUnauthorizedErrorResponse(token);
  }

  const userClient = createUserServerClient(token);
  const { data, error } = await userClient.auth.getUser(token);

  if (error || !data.user) {
    return unauthorized('当前登录凭证无效，请重新登录。', 'INVALID_TOKEN');
  }

  return {
    userClient,
    userId: data.user.id,
    quoteId: getQuoteId(request),
  };
}

async function findQuote(userClient: any, quoteId: string) {
  const { data, error } = await userClient.from('quotes').select('id').eq('id', quoteId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function findHeartbeat(userClient: any, userId: string, quoteId: string) {
  const { data, error } = await userClient
    .from('heartbeats')
    .select('id, count')
    .eq('user_id', userId)
    .eq('quote_id', quoteId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function getQuoteId(request: Request) {
  const url = new URL(request.url);
  return decodeURIComponent(url.pathname.split('/').at(-1) ?? '');
}

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

    const { error } = await userClient.from('favorites').upsert(
      {
        user_id: userId,
        quote_id: quoteId,
      },
      {
        onConflict: 'user_id,quote_id',
        ignoreDuplicates: true,
      },
    );

    if (error) {
      throw error;
    }

    return successResponse({ favorited: true });
  } catch (error) {
    console.error('POST /api/favorites/:quoteId failed', error);
    return internalError('收藏金句失败。', 'FAVORITE_CREATE_FAILED');
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await authenticateRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const { userClient, userId, quoteId } = authResult;
    const deleteQuery = userClient.from('favorites').delete().eq('user_id', userId);
    const { error } = await deleteQuery.eq('quote_id', quoteId);

    if (error) {
      throw error;
    }

    return successResponse({ favorited: false });
  } catch (error) {
    console.error('DELETE /api/favorites/:quoteId failed', error);
    return internalError('取消收藏失败。', 'FAVORITE_DELETE_FAILED');
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

function getQuoteId(request: Request) {
  const url = new URL(request.url);
  return decodeURIComponent(url.pathname.split('/').at(-1) ?? '');
}

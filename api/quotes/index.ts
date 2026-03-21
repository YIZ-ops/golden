import { createUnauthorizedErrorResponse, getOptionalBearerToken, isAuthFailure } from '../_lib/auth';
import { badRequest, internalError, unauthorized, successResponse } from '../_lib/http';
import { createAnonServerClient, createUserServerClient } from '../_lib/supabase';
import { getViewerStateMap } from './viewer-state';
import { isQueryValidationError, parseQuoteQuery } from './query';

interface QuoteRow {
  id: string;
  content: string;
  author: string;
  author_role?: string;
  category?: string | null;
  source?: string | null;
  source_type?: string | null;
  created_at?: string | null;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const maybeToken = getOptionalBearerToken(authHeader);

    if (isAuthFailure(maybeToken)) {
      return createUnauthorizedErrorResponse(maybeToken);
    }

    let currentUserId: string | null = null;
    let queryClient = createAnonServerClient();
    let viewerStateMap: Awaited<ReturnType<typeof getViewerStateMap>> | null = null;

    if (typeof maybeToken === 'string') {
      const userClient = createUserServerClient(maybeToken);
      const { data, error } = await userClient.auth.getUser(maybeToken);

      if (error || !data.user) {
        return unauthorized('当前登录凭证无效，请重新登录。', 'INVALID_TOKEN');
      }

      currentUserId = data.user.id;
      queryClient = userClient;
      viewerStateMap = await getViewerStateMap(userClient);
    }

    const parsed = parseQuoteQuery(new URL(request.url));

    if (isQueryValidationError(parsed)) {
      return badRequest(parsed.message, parsed.code);
    }

    const rangeStart = (parsed.page - 1) * parsed.pageSize;
    const rangeEnd = rangeStart + parsed.pageSize - 1;

    let query = queryClient.from('quotes').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (parsed.category) {
      query = query.eq('category', parsed.category);
    }

    if (parsed.authorRole) {
      query = query.eq('author_role', parsed.authorRole);
    }

    if (parsed.author) {
      query = query.eq('author', parsed.author);
    }

    if (parsed.keyword) {
      query = query.ilike('content', `%${parsed.keyword}%`);
    }

    const { data, count, error } = await query.range(rangeStart, rangeEnd);

    if (error) {
      throw error;
    }

    const items = (data ?? []).map((item: QuoteRow) => {
      const normalized = {
        id: item.id,
        content: item.content,
        author: item.author,
        category: item.category ?? undefined,
        source: item.source ?? undefined,
        sourceType: normalizeSourceType(item.source_type),
        createdAt: item.created_at ?? undefined,
      };

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
    console.error('GET /api/quotes failed', error);
    return internalError('获取金句列表失败。', 'QUOTE_LIST_FAILED');
  }
}

function normalizeSourceType(value?: string | null) {
  if (value === 'seed' || value === 'hitokoto' || value === 'manual') {
    return value;
  }

  return undefined;
}

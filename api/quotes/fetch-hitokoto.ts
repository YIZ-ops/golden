import { HITOKOTO_CATEGORIES } from '@/constants/categories';

import { badRequest, internalError, successResponse, upstreamError } from '../_lib/http';

interface HitokotoResponse {
  uuid: string;
  hitokoto: string;
  from: string;
  from_who: string | null;
  type: string;
}

const validCategoryIds = new Set(HITOKOTO_CATEGORIES.map((item) => item.id));

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const category = readCategory(body.category);

    if (category && !validCategoryIds.has(category)) {
      return badRequest('category 参数无效。', 'INVALID_HITOKOTO_CATEGORY');
    }

    const query = category ? `?c=${encodeURIComponent(category)}` : '';
    const response = await fetch(`https://v1.hitokoto.cn/${query}`);

    if (!response.ok) {
      return upstreamError('一言接口暂时不可用。', 'HITOKOTO_UPSTREAM_FAILED');
    }

    const data = (await response.json()) as HitokotoResponse;
    const matchedCategory = HITOKOTO_CATEGORIES.find((item) => item.id === data.type || item.id === category);

    return successResponse({
      quote: {
        id: data.uuid,
        content: data.hitokoto,
        author: data.from_who ?? '佚名',
        source: data.from,
        category: matchedCategory?.name ?? '其他',
        sourceType: 'hitokoto',
      },
    });
  } catch (error) {
    console.error('POST /api/quotes/fetch-hitokoto failed', error);
    return internalError('获取一言失败。', 'FETCH_HITOKOTO_FAILED');
  }
}

async function readBody(request: Request): Promise<{ category?: unknown }> {
  try {
    return (await request.json()) as { category?: unknown };
  } catch {
    return {};
  }
}

function readCategory(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

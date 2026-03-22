import { HITOKOTO_CATEGORIES } from "../../src/constants/categories.js";

import { ingestHitokotoQuote } from "./ingest.js";
import { badRequest, internalError, successResponse } from "../_lib/http.js";

const validCategoryIds = new Set(HITOKOTO_CATEGORIES.map((item) => item.id));

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const category = readCategory(body.category);

    if (category && !validCategoryIds.has(category)) {
      return badRequest("category 参数无效。", "INVALID_HITOKOTO_CATEGORY");
    }

    const quote = await ingestHitokotoQuote(category);

    return successResponse({
      quote,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("POST /api/quotes/fetch-hitokoto failed", error);
    return internalError("获取一言失败。", "FETCH_HITOKOTO_FAILED");
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
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

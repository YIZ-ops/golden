import { AUTHORS, HITOKOTO_CATEGORIES, SINGERS } from "../../src/constants/categories.js";

export interface QuoteQueryParams {
  category: string | null;
  author: string | null;
  personId: string | null;
  keyword: string | null;
  page: number;
  pageSize: number;
}

export interface QueryValidationError {
  message: string;
  code: string;
}

const VALID_CATEGORIES = new Set(HITOKOTO_CATEGORIES.map((item) => item.name));
const VALID_AUTHORS = new Set([...AUTHORS, ...SINGERS].map((item) => item.name));

export function parseQuoteQuery(url: URL): QuoteQueryParams | QueryValidationError {
  const category = readValue(url.searchParams.get("category"));
  const author = readValue(url.searchParams.get("author"));
  const personId = readValue(url.searchParams.get("personId"));
  const keyword = readValue(url.searchParams.get("keyword"));
  const pageValue = readValue(url.searchParams.get("page")) ?? "1";
  const pageSizeValue = readValue(url.searchParams.get("pageSize")) ?? "20";

  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page < 1 || pageSize < 1 || pageSize > 50) {
    return {
      message: "分页参数无效，page 必须大于等于 1，pageSize 必须在 1 到 50 之间。",
      code: "INVALID_PAGINATION",
    };
  }

  if (category && !VALID_CATEGORIES.has(category)) {
    return {
      message: "category 参数无效。",
      code: "INVALID_CATEGORY",
    };
  }

  if (author && !VALID_AUTHORS.has(author)) {
    return {
      message: "author 参数无效。",
      code: "INVALID_AUTHOR_FILTER",
    };
  }

  return {
    category,
    author,
    personId,
    keyword,
    page,
    pageSize,
  };
}

export function isQueryValidationError(value: QuoteQueryParams | QueryValidationError): value is QueryValidationError {
  return "code" in value;
}

function readValue(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

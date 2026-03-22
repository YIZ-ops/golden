import { AUTHORS, HITOKOTO_CATEGORIES, SINGERS } from '../../src/constants/categories.js';

export type AuthorRole = 'author' | 'singer' | 'unknown';

export interface QuoteQueryParams {
  category: string | null;
  author: string | null;
  authorRole: AuthorRole | null;
  personId: string | null;
  keyword: string | null;
  page: number;
  pageSize: number;
}

export interface QueryValidationError {
  message: string;
  code: string;
}

const VALID_AUTHOR_ROLES = new Set<AuthorRole>(['author', 'singer', 'unknown']);
const VALID_CATEGORIES = new Set(HITOKOTO_CATEGORIES.map((item) => item.name));
const VALID_AUTHORS = new Set(AUTHORS.map((item) => item.name));
const VALID_SINGERS = new Set(SINGERS.map((item) => item.name));

export function parseQuoteQuery(url: URL): QuoteQueryParams | QueryValidationError {
  const category = readValue(url.searchParams.get('category'));
  const author = readValue(url.searchParams.get('author'));
  const authorRoleValue = readValue(url.searchParams.get('authorRole'));
  const personId = readValue(url.searchParams.get('personId'));
  const keyword = readValue(url.searchParams.get('keyword'));
  const pageValue = readValue(url.searchParams.get('page')) ?? '1';
  const pageSizeValue = readValue(url.searchParams.get('pageSize')) ?? '20';

  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page < 1 || pageSize < 1 || pageSize > 50) {
    return {
      message: '分页参数无效，page 必须大于等于 1，pageSize 必须在 1 到 50 之间。',
      code: 'INVALID_PAGINATION',
    };
  }

  let authorRole: AuthorRole | null = null;

  if (authorRoleValue) {
    if (!VALID_AUTHOR_ROLES.has(authorRoleValue as AuthorRole)) {
      return {
        message: 'authorRole 参数无效。',
        code: 'INVALID_AUTHOR_ROLE',
      };
    }

    authorRole = authorRoleValue as AuthorRole;
  }

  if (category && !VALID_CATEGORIES.has(category)) {
    return {
      message: 'category 参数无效。',
      code: 'INVALID_CATEGORY',
    };
  }

  if (author && authorRole === 'author' && !VALID_AUTHORS.has(author)) {
    return {
      message: '当前 authorRole 下不存在该 author 选项。',
      code: 'INVALID_AUTHOR_FILTER',
    };
  }

  if (author && authorRole === 'singer' && !VALID_SINGERS.has(author)) {
    return {
      message: '当前 authorRole 下不存在该 author 选项。',
      code: 'INVALID_AUTHOR_FILTER',
    };
  }

  return {
    category,
    author,
    authorRole,
    personId,
    keyword,
    page,
    pageSize,
  };
}

export function isQueryValidationError(
  value: QuoteQueryParams | QueryValidationError,
): value is QueryValidationError {
  return 'code' in value;
}

function readValue(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

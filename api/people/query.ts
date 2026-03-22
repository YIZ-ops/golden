export type PeopleRole = 'author' | 'singer';

export interface PeopleQueryParams {
  role: PeopleRole | null;
  keyword: string | null;
  page: number;
  pageSize: number;
}

export interface PeopleQueryValidationError {
  message: string;
  code: string;
}

const VALID_ROLES = new Set<PeopleRole>(['author', 'singer']);

export function parsePeopleQuery(url: URL): PeopleQueryParams | PeopleQueryValidationError {
  const roleValue = readValue(url.searchParams.get('role'));
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

  if (roleValue && !VALID_ROLES.has(roleValue as PeopleRole)) {
    return {
      message: 'role 参数无效。',
      code: 'INVALID_PERSON_ROLE',
    };
  }

  return {
    role: (roleValue as PeopleRole | null) ?? null,
    keyword,
    page,
    pageSize,
  };
}

export function isPeopleQueryValidationError(
  value: PeopleQueryParams | PeopleQueryValidationError,
): value is PeopleQueryValidationError {
  return 'code' in value;
}

function readValue(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

import { apiRequest } from '@/services/api/client';
import type { PaginatedResponse } from '@/types/api';
import type { PersonListItem, PersonRole } from '@/types/person';

export interface GetPeopleParams {
  role?: PersonRole;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function getPeople(params: GetPeopleParams = {}) {
  const query = buildQueryString(params);
  const path = query ? `/api/people?${query}` : '/api/people';
  return apiRequest<PaginatedResponse<PersonListItem>>(path);
}

function buildQueryString(params: GetPeopleParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

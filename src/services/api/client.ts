import { getAccessToken } from '@/services/supabase/session';
import type { ApiErrorPayload } from '@/types/api';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = normalizeHeaders(options.headers);
  headers.Accept = 'application/json';

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, init);
  const payload = await readJson(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : { message: '请求失败。' };
    throw new ApiClientError(response.status, errorPayload.message, errorPayload.code);
  }

  return payload as T;
}

async function readJson(response: Response) {
  const contentType = response.headers.get('Content-Type');

  if (!contentType?.includes('application/json')) {
    return null;
  }

  return response.json();
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'message' in value &&
      typeof (value as { message?: unknown }).message === 'string',
  );
}

function normalizeHeaders(headers?: HeadersInit) {
  if (!headers) {
    return {} as Record<string, string>;
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return { ...headers };
}

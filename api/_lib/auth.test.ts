import { describe, expect, it } from 'vitest';

import {
  getOptionalBearerToken,
  requireBearerToken,
  createUnauthorizedErrorResponse,
  isJwtExpired,
  isAuthFailure,
} from './auth';

describe('auth helpers', () => {
  it('allows public requests without an auth header', () => {
    expect(getOptionalBearerToken(null)).toBeNull();
  });

  it('extracts a valid bearer token', () => {
    expect(getOptionalBearerToken('Bearer token-123')).toBe('token-123');
  });

  it('rejects malformed bearer headers', async () => {
    const result = getOptionalBearerToken('Token abc');

    expect(isAuthFailure(result)).toBe(true);
    const response = createUnauthorizedErrorResponse(result as Exclude<typeof result, string | null>);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Authorization 请求头格式无效。',
      code: 'INVALID_AUTH_HEADER',
    });
  });

  it('returns 401 for an explicitly expired token', async () => {
    const expiredToken = createJwt({
      exp: Math.floor(Date.now() / 1000) - 60,
      sub: 'user-1',
    });

    expect(isJwtExpired(expiredToken)).toBe(true);

    const result = requireBearerToken(`Bearer ${expiredToken}`);

    expect(isAuthFailure(result)).toBe(true);
    const response = createUnauthorizedErrorResponse(result as Exclude<typeof result, string>);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      message: '登录会话已过期，请重新登录。',
      code: 'TOKEN_EXPIRED',
    });
  });
});

function createJwt(payload: Record<string, unknown>) {
  const encodedHeader = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const encodedPayload = base64UrlEncode(payload);
  return `${encodedHeader}.${encodedPayload}.signature`;
}

function base64UrlEncode(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

import { unauthorized } from "./http";

export interface AuthFailure {
  ok: false;
  status: 401;
  message: string;
  code: "MISSING_AUTH_HEADER" | "INVALID_AUTH_HEADER" | "TOKEN_EXPIRED";
}

interface JwtPayload {
  exp?: number;
  sub?: string;
}

export function getOptionalBearerToken(header: string | null): string | AuthFailure | null {
  if (!header) {
    return null;
  }

  return parseBearerHeader(header);
}

export function requireBearerToken(header: string | null): string | AuthFailure {
  if (!header) {
    return {
      ok: false,
      status: 401,
      message: "当前请求缺少 Authorization 请求头。",
      code: "MISSING_AUTH_HEADER",
    };
  }

  return parseBearerHeader(header);
}

export function createUnauthorizedErrorResponse(result: AuthFailure) {
  return unauthorized(result.message, result.code);
}

export function isAuthFailure(value: string | AuthFailure | null): value is AuthFailure {
  return Boolean(value && typeof value === "object" && "ok" in value && value.ok === false);
}

export function isJwtExpired(token: string) {
  const payload = parseJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp <= Math.floor(Date.now() / 1000);
}

export function getUserIdFromJwt(token: string) {
  const payload = parseJwtPayload(token);
  const userId = payload?.sub;

  if (!userId || typeof userId !== "string") {
    return null;
  }

  const normalized = userId.trim();
  return normalized || null;
}

function parseBearerHeader(header: string): string | AuthFailure {
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      ok: false,
      status: 401,
      message: "Authorization 请求头格式无效。",
      code: "INVALID_AUTH_HEADER",
    };
  }

  const token = match[1].trim();

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Authorization 请求头格式无效。",
      code: "INVALID_AUTH_HEADER",
    };
  }

  if (isJwtExpired(token)) {
    return {
      ok: false,
      status: 401,
      message: "登录会话已过期，请重新登录。",
      code: "TOKEN_EXPIRED",
    };
  }

  return token;
}

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

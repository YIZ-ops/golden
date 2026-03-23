import { createUnauthorizedErrorResponse, isAuthFailure, requireBearerToken } from "./_lib/auth.js";
import { badRequest, internalError, successResponse, unauthorized } from "./_lib/http.js";
import { ensureProfile } from "./_lib/profile.js";
import { createUserServerClient } from "./_lib/supabase.js";

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const profile = await ensureProfile(authResult.userClient as any, authResult.user as any);
    return successResponse({
      profile: normalizeProfile(profile),
    });
  } catch (error) {
    console.error("GET /api/profile failed", error);
    return internalError("获取用户资料失败。", "PROFILE_GET_FAILED");
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await authenticateRequest(request);

    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await readJson(request);
    const updates = parseProfilePatch(body);

    if ("code" in updates) {
      return badRequest(updates.message, updates.code);
    }

    await ensureProfile(authResult.userClient as any, authResult.user as any);

    const updatePayload: Record<string, string | null> = {};

    if (updates.hasDisplayName) {
      updatePayload.display_name = updates.displayName;
    }

    if (updates.hasAvatarUrl) {
      updatePayload.avatar_url = updates.avatarUrl;
    }

    if (updates.hasThemeMode) {
      updatePayload.theme_mode = updates.themeMode;
    }

    const updateQuery = authResult.userClient.from("profiles").update(updatePayload);
    const { data, error } = await updateQuery.eq("id", authResult.user.id).select("*").maybeSingle();

    if (error) {
      throw error;
    }

    return successResponse({
      profile: normalizeProfile(data),
    });
  } catch (error) {
    console.error("PATCH /api/profile failed", error);
    return internalError("更新用户资料失败。", "PROFILE_PATCH_FAILED");
  }
}

async function authenticateRequest(request: Request) {
  const token = requireBearerToken(request.headers.get("Authorization"));

  if (isAuthFailure(token)) {
    return createUnauthorizedErrorResponse(token);
  }

  const userClient = createUserServerClient(token);
  const { data, error } = await userClient.auth.getUser(token);

  if (error || !data.user) {
    return unauthorized("当前登录凭证无效，请重新登录。", "INVALID_TOKEN");
  }

  return {
    userClient,
    user: data.user,
  };
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseProfilePatch(body: Record<string, unknown>) {
  const allowedThemeModes = new Set(["light", "dark", "system"]);
  const hasDisplayName = hasOwn(body, "displayName");
  const hasAvatarUrl = hasOwn(body, "avatarUrl");
  const hasThemeMode = hasOwn(body, "themeMode");

  if (!hasDisplayName && !hasAvatarUrl && !hasThemeMode) {
    return {
      message: "profile patch 参数无效。",
      code: "INVALID_PROFILE_PATCH",
    };
  }

  const displayName = hasDisplayName ? readPatchString(body.displayName) : undefined;
  const avatarUrl = hasAvatarUrl ? readPatchString(body.avatarUrl) : undefined;
  const themeMode = hasThemeMode ? readPatchString(body.themeMode) : undefined;

  if (displayName === INVALID_PATCH_VALUE || avatarUrl === INVALID_PATCH_VALUE || themeMode === INVALID_PATCH_VALUE) {
    return {
      message: "profile patch 参数无效。",
      code: "INVALID_PROFILE_PATCH",
    };
  }

  if (hasThemeMode && (!themeMode || !allowedThemeModes.has(themeMode))) {
    return {
      message: "profile patch 参数无效。",
      code: "INVALID_PROFILE_PATCH",
    };
  }

  return {
    displayName,
    avatarUrl,
    themeMode,
    hasDisplayName,
    hasAvatarUrl,
    hasThemeMode,
  };
}

const INVALID_PATCH_VALUE = Symbol("INVALID_PATCH_VALUE");

function readPatchString(value: unknown) {
  if (typeof value !== "string") {
    return INVALID_PATCH_VALUE;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function hasOwn(object: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeProfile(profile: any) {
  return {
    id: profile?.id,
    email: profile?.email ?? "",
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    themeMode: profile?.theme_mode ?? "light",
  };
}

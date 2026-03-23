import { apiRequest } from "@/services/api/client";
import { getAccessToken } from "@/services/supabase/session";
import type { UserProfile } from "@/types/user";

const PROFILE_CACHE_TTL = 30_000;

type ProfileResponse = { profile: UserProfile };

const profileCache = new Map<string, { expiresAt: number; value: ProfileResponse }>();
const profileRequests = new Map<string, Promise<ProfileResponse>>();

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  themeMode?: "light" | "dark" | "system";
}

export async function getProfile() {
  const token = (await getAccessToken()) ?? "anonymous";
  const now = Date.now();
  const cached = profileCache.get(token);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const pending = profileRequests.get(token);

  if (pending) {
    return pending;
  }

  const request = apiRequest<ProfileResponse>("/api/profile")
    .then((result) => {
      profileCache.set(token, {
        expiresAt: Date.now() + PROFILE_CACHE_TTL,
        value: result,
      });
      return result;
    })
    .finally(() => {
      profileRequests.delete(token);
    });

  profileRequests.set(token, request);
  return request;
}

export async function updateProfile(input: UpdateProfileInput) {
  const result = await apiRequest<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: input,
  });

  invalidateProfileCache();
  return result;
}

export function invalidateProfileCache() {
  profileCache.clear();
  profileRequests.clear();
}

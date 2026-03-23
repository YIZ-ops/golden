import { apiRequest } from "@/services/api/client";

export interface ReflectionItem {
  id: string;
  quoteId: string;
  userId: string;
  content: string;
  createdAt?: string;
}

export interface CreateReflectionInput {
  quoteId: string;
  content: string;
}

const REFLECTIONS_CACHE_TTL = 30_000;

const reflectionsCache = new Map<string, { expiresAt: number; value: { items: ReflectionItem[] } }>();
const reflectionsRequests = new Map<string, Promise<{ items: ReflectionItem[] }>>();

export async function getReflections(quoteId: string) {
  const now = Date.now();
  const cached = reflectionsCache.get(quoteId);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const pending = reflectionsRequests.get(quoteId);

  if (pending) {
    return pending;
  }

  const request = apiRequest<{ items: ReflectionItem[] }>(`/api/reflections?quoteId=${encodeURIComponent(quoteId)}`)
    .then((result) => {
      reflectionsCache.set(quoteId, {
        expiresAt: Date.now() + REFLECTIONS_CACHE_TTL,
        value: result,
      });
      return result;
    })
    .finally(() => {
      reflectionsRequests.delete(quoteId);
    });

  reflectionsRequests.set(quoteId, request);
  return request;
}

export async function createReflection(input: CreateReflectionInput) {
  const result = await apiRequest<{ reflection: ReflectionItem }>("/api/reflections", {
    method: "POST",
    body: input,
  });

  invalidateReflectionsCache(input.quoteId);
  return result;
}

export async function deleteReflection(reflectionId: string, quoteId?: string) {
  const result = await apiRequest<{ deleted: true; reflectionId: string }>("/api/reflections", {
    method: "DELETE",
    body: { reflectionId },
  });

  invalidateReflectionsCache(quoteId);
  return result;
}

export function invalidateReflectionsCache(quoteId?: string) {
  if (!quoteId) {
    reflectionsCache.clear();
    reflectionsRequests.clear();
    return;
  }

  reflectionsCache.delete(quoteId);
  reflectionsRequests.delete(quoteId);
}

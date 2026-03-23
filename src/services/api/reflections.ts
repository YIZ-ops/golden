import { apiRequest } from '@/services/api/client';

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

export async function getReflections(quoteId: string) {
  return apiRequest<{ items: ReflectionItem[] }>(`/api/reflections?quoteId=${encodeURIComponent(quoteId)}`);
}

export async function createReflection(input: CreateReflectionInput) {
  return apiRequest<{ reflection: ReflectionItem }>('/api/reflections', {
    method: 'POST',
    body: input,
  });
}

export async function deleteReflection(reflectionId: string) {
  return apiRequest<{ deleted: true; reflectionId: string }>('/api/reflections', {
    method: 'DELETE',
    body: { reflectionId },
  });
}

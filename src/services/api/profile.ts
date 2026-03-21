import { apiRequest } from '@/services/api/client';
import type { UserProfile } from '@/types/user';

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  themeMode?: 'light' | 'dark' | 'system';
}

export async function getProfile() {
  return apiRequest<{ profile: UserProfile }>('/api/profile');
}

export async function updateProfile(input: UpdateProfileInput) {
  return apiRequest<{ profile: UserProfile }>('/api/profile', {
    method: 'PATCH',
    body: input,
  });
}

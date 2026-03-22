import { apiRequest } from '@/services/api/client';

export async function heartbeatQuote(quoteId: string) {
  return apiRequest<{ quoteId: string; count: number }>('/api/heartbeats', {
    method: 'POST',
    body: {
      quoteId,
    },
  });
}

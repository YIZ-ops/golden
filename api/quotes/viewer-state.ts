interface FavoriteRow {
  quote_id: string;
}

interface HeartbeatRow {
  quote_id: string;
  count: number;
}

export async function getViewerStateMap(
  userClient: any,
  userId: string,
  quoteIds: string[],
) {
  const uniqueQuoteIds = Array.from(new Set(quoteIds.filter(Boolean)));

  if (uniqueQuoteIds.length === 0) {
    return {
      favoriteSet: new Set<string>(),
      heartbeatMap: new Map<string, number>(),
    };
  }

  const [{ data: favoriteRows, error: favoriteError }, { data: heartbeatRows, error: heartbeatError }] =
    await Promise.all([
      userClient.from('favorites').select('quote_id').eq('user_id', userId).in('quote_id', uniqueQuoteIds),
      userClient.from('heartbeats').select('quote_id, count').eq('user_id', userId).in('quote_id', uniqueQuoteIds),
    ]);

  if (favoriteError) {
    throw favoriteError;
  }

  if (heartbeatError) {
    throw heartbeatError;
  }

  const favoriteSet = new Set((favoriteRows ?? []).map((item) => item.quote_id));
  const heartbeatMap = new Map<string, number>();

  for (const row of (heartbeatRows ?? []) as HeartbeatRow[]) {
    heartbeatMap.set(row.quote_id, row.count);
  }

  return {
    favoriteSet,
    heartbeatMap,
  };
}

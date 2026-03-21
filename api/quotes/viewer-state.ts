interface FavoriteRow {
  quote_id: string;
}

interface HeartbeatRow {
  quote_id: string;
  count: number;
}

export async function getViewerStateMap(
  userClient: {
    from: (table: 'favorites' | 'heartbeats') => {
      select: (columns: string) => PromiseLike<{ data: FavoriteRow[] | HeartbeatRow[] | null; error: Error | null }> | {
        then: PromiseLike<{ data: FavoriteRow[] | HeartbeatRow[] | null; error: Error | null }>['then'];
      };
    };
  },
) {
  const [{ data: favoriteRows, error: favoriteError }, { data: heartbeatRows, error: heartbeatError }] =
    await Promise.all([
      userClient.from('favorites').select('quote_id'),
      userClient.from('heartbeats').select('quote_id, count'),
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

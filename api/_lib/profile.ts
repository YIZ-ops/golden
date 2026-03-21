import type { User } from '@supabase/supabase-js';

import type { UserProfile } from '@/types/user';

type ProfileClient = {
  from: (table: 'profiles') => {
    upsert: (
      values: {
        id: string;
        email: string | null;
        display_name: string | null;
        avatar_url: string | null;
      },
      options: { onConflict: string; ignoreDuplicates: boolean },
    ) => Promise<{ error: Error | null }>;
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: UserProfile | null; error: Error | null }>;
      };
    };
  };
};

export async function ensureProfile(userClient: ProfileClient, user: User) {
  const displayName =
    readString(user.user_metadata?.display_name) ??
    readString(user.user_metadata?.full_name) ??
    (user.email ? user.email.split('@')[0] : null);

  const avatarUrl = readString(user.user_metadata?.avatar_url) ?? null;

  const { error: upsertError } = await userClient.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: true,
    },
  );

  if (upsertError) {
    throw upsertError;
  }

  const { data, error } = await userClient.from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

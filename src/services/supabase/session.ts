import { supabase } from '@/services/supabase/browser';

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function requireAccessToken() {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('当前没有可用的登录会话。');
  }

  return token;
}

export async function clearSessionAndRedirect(redirectTo = '/auth/login') {
  await supabase.auth.signOut();

  if (typeof window !== 'undefined') {
    window.location.assign(redirectTo);
  }
}

export async function bootstrapRecoverySession() {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type') ?? hashParams.get('type');

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      return false;
    }

    clearRecoveryArtifacts(url);
    return true;
  }

  if (type === 'recovery') {
    const { data } = await supabase.auth.getSession();
    clearRecoveryArtifacts(url);
    return Boolean(data.session);
  }

  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

function clearRecoveryArtifacts(url: URL) {
  url.searchParams.delete('code');
  url.searchParams.delete('type');
  url.hash = '';

  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}

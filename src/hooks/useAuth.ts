import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { assertSupabaseConfigured, supabase } from '@/services/supabase/browser';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithPassword(email: string, password: string) {
    assertSupabaseConfigured();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }
  }

  async function signUpWithPassword(email: string, password: string) {
    assertSupabaseConfigured();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      throw error;
    }
  }

  async function sendResetPasswordEmail(email: string) {
    assertSupabaseConfigured();

    const redirectTo =
      typeof window === 'undefined' ? undefined : `${window.location.origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      throw error;
    }
  }

  async function updatePassword(password: string) {
    assertSupabaseConfigured();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw error;
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  return {
    session,
    user,
    loading,
    signInWithPassword,
    signUpWithPassword,
    sendResetPasswordEmail,
    updatePassword,
    signOut,
  };
}

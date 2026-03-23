import { useEffect, type PropsWithChildren } from 'react';

import { ThemeProvider } from '@/app/theme/ThemeProvider';
import { useTheme } from '@/app/theme/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/api/profile';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <ThemeBootstrap />
      {children}
    </ThemeProvider>
  );
}

function ThemeBootstrap() {
  const { user, loading } = useAuth();
  const { setThemeMode } = useTheme();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setThemeMode('system');
      return;
    }

    let active = true;

    getProfile()
      .then((result) => {
        if (!active) {
          return;
        }

        setThemeMode(result.profile.themeMode ?? 'system');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setThemeMode('system');
      });

    return () => {
      active = false;
    };
  }, [loading, setThemeMode, user]);

  return null;
}

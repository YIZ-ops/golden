export interface UserProfile {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: 'user' | 'admin';
  themeMode?: 'light' | 'dark' | 'system';
}

export interface AuthCredentials {
  email: string;
  password: string;
}

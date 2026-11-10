import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface AuthUser {
  email: string;
  name: string;
  provider: 'keycloak';
  id?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  beginLogin: (
    intent?: 'passenger' | 'oims' | 'hims',
    returnTo?: string,
    options?: { loginHint?: string; register?: boolean },
  ) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loginPath(
  intent: 'passenger' | 'oims' | 'hims',
  returnTo: string,
  options?: { loginHint?: string; register?: boolean },
): string {
  const params = new URLSearchParams({ intent, returnTo });
  if (options?.loginHint) params.set('loginHint', options.loginHint);
  if (options?.register) params.set('action', 'register');
  return `/api/auth/login?${params.toString()}`;
}

async function readSession(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  const body = await response.json() as {
    authenticated?: boolean;
    user?: { email?: string | null; name?: string; id?: string };
  };
  if (body.authenticated && body.user?.email) {
    return {
      email: body.user.email,
      name: body.user.name || body.user.email.split('@')[0],
      provider: 'keycloak',
      id: body.user.id,
    };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      setUser(await readSession());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    readSession()
      .then((next) => {
        if (!cancelled) setUser(next);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const beginLogin = useCallback((
    intent: 'passenger' | 'oims' | 'hims' = 'passenger',
    returnTo = '/',
    options?: { loginHint?: string; register?: boolean },
  ) => {
    window.location.assign(loginPath(intent, returnTo, options));
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) return { error: body.error === 'invite_not_accepted' ? 'Open the invitation link from HIMS to set your password.' : 'Email or password is incorrect.' };
    await refreshSession();
    return { error: null };
  }, [refreshSession]);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password, displayName: displayName ?? email.split('@')[0] }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) return { error: body.error ?? 'Could not create the account.' };
    await refreshSession();
    return { error: null };
  }, [refreshSession]);

  const signInWithProvider = useCallback(async () => {
    return { error: 'Google and Apple sign-in are not enabled yet.' };
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    window.location.assign('/');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithProvider, signOut, beginLogin, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

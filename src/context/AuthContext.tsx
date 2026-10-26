import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface AuthUser {
  email: string;
  name: string;
  provider: 'email' | 'google' | 'apple';
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = 'travelar_auth_user';
const PROVIDERS: ReadonlyArray<AuthUser['provider']> = ['email', 'google', 'apple'];

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The signed-in user is cached in localStorage purely as a UI convenience. It is
 * readable and writable by any script on the origin, so it is never an
 * authorisation boundary — every protected action must be re-checked by the API.
 * Anything that does not match the expected shape is discarded rather than trusted.
 */
function normalizeUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  const email = typeof candidate.email === 'string' ? candidate.email.trim() : '';
  const provider = candidate.provider;
  const isKnownProvider = typeof provider === 'string' && PROVIDERS.includes(provider as AuthUser['provider']);

  if (!email || email.length > 254 || !email.includes('@') || !isKnownProvider) return null;

  const rawName = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  return {
    email,
    name: (rawName || email.split('@')[0]).slice(0, 80),
    provider: provider as AuthUser['provider'],
  };
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const user = normalizeUser(JSON.parse(raw));
    if (!user) localStorage.removeItem(STORAGE_KEY);
    return user;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(loadUser());
    setLoading(false);
  }, []);

  const persistUser = useCallback((newUser: AuthUser | null) => {
    saveUser(newUser);
    setUser(newUser);
  }, []);

  const signInWithEmail = useCallback(async (email: string, _password: string) => {
    await delay(800);
    persistUser({ email, name: email.split('@')[0], provider: 'email' });
    return { error: null };
  }, [persistUser]);

  const signUpWithEmail = useCallback(async (email: string, _password: string) => {
    await delay(1000);
    persistUser({ email, name: email.split('@')[0], provider: 'email' });
    return { error: null };
  }, [persistUser]);

  const signInWithProvider = useCallback(async (provider: 'google' | 'apple') => {
    await delay(1000);
    const fakeEmail = provider === 'google' ? 'user@gmail.com' : 'user@icloud.com';
    persistUser({ email: fakeEmail, name: 'Travelar User', provider });
    return { error: null };
  }, [persistUser]);

  const signOut = useCallback(async () => {
    persistUser(null);
  }, [persistUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithProvider, signOut }}
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

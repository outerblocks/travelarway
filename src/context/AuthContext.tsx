import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
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
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());
  const [loading] = useState(false);

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

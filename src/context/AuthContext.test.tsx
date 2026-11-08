import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { stubAuthPolicy } from '@/auth/stubAuth';

const KEY = 'travelar_auth_user';
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// These pin the CURRENT (simulated) behaviour: any credentials succeed.
describe('AuthContext (current simulated behaviour)', () => {
  it('starts signed out', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('restores a user from localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify({ email: 'x@y.z', name: 'x', provider: 'email' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.email).toBe('x@y.z');
  });

  it('ignores corrupt localStorage data', () => {
    localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('signInWithEmail accepts any password and persists the user without simulated latency', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let res: { error: string | null } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail('jane@example.com', 'wrong');
    });
    expect(res).toEqual({ error: null });
    expect(result.current.user).toEqual({ email: 'jane@example.com', name: 'jane', provider: 'email' });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(result.current.user);
  });

  it('signUpWithEmail signs the user in immediately', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signUpWithEmail('new@example.com', 'pw');
    });
    expect(result.current.user?.name).toBe('new');
  });

  it('signInWithProvider returns a fixed fake identity', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      const p = result.current.signInWithProvider('google');
      await vi.advanceTimersByTimeAsync(1000);
      await p;
    });
    expect(result.current.user).toEqual({ email: 'user@gmail.com', name: 'Travelar User', provider: 'google' });

    await act(async () => {
      const p = result.current.signInWithProvider('apple');
      await vi.advanceTimersByTimeAsync(1000);
      await p;
    });
    expect(result.current.user?.email).toBe('user@icloud.com');
  });

  it('signOut clears the user and storage', async () => {
    localStorage.setItem(KEY, JSON.stringify({ email: 'x@y.z', name: 'x', provider: 'email' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('useAuth throws outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });
});

describe('AuthContext (production fail-closed)', () => {
  it('refuses stub sign-in and clears a forged localStorage user', async () => {
    const allowed = vi.spyOn(stubAuthPolicy, 'isAllowed').mockReturnValue(false);
    localStorage.setItem(KEY, JSON.stringify({ email: 'x@y.z', name: 'x', provider: 'email' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();

    let res: { error: string | null } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail('jane@example.com', 'any');
    });
    expect(res?.error).toMatch(/identity provider/i);
    expect(result.current.user).toBeNull();
    allowed.mockRestore();
  });
});

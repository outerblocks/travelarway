import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext (Keycloak BFF session)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ authenticated: false, provider: 'none' }), {
        headers: { 'content-type': 'application/json' },
      }),
    ));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts from the server session, not localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('adopts an authenticated Keycloak session', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({
        authenticated: true,
        provider: 'keycloak',
        user: { id: 'u1', email: 'ada@example.com', name: 'ada' },
      }), { headers: { 'content-type': 'application/json' } }),
    ));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.email).toBe('ada@example.com'));
    expect(result.current.user?.provider).toBe('keycloak');
  });

  it('beginLogin sends the browser to the BFF', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign, href: 'http://localhost/' });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.beginLogin('oims', '/operator/bus');
    });
    expect(assign).toHaveBeenCalledWith('/api/auth/login?intent=oims&returnTo=%2Foperator%2Fbus');
  });

  it('signInWithEmail posts credentials to the BFF', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes('/api/auth/password')) {
        return new Response(JSON.stringify({ ok: true, user: { email: 'ada@example.com' } }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({
        authenticated: true,
        provider: 'keycloak',
        user: { email: 'ada@example.com', name: 'ada' },
      }), { headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signInWithEmail('ada@example.com', 'Operator12');
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/password', expect.objectContaining({ method: 'POST' }));
  });

  it('useAuth throws outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });
});

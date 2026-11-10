import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { stayReadyDuringRefetch } from '@/hooks/query-status';
import { filterHqNav, type HqNavItem } from '@/domain/hq-nav';

export interface HqMe {
  userId: string;
  permissions: string[];
  roles: { id: string; code: string; name: string }[];
  departments: { id: string; code: string; name: string }[];
  marketId: string | null;
  desk: string;
}

export function useHqSession() {
  const [me, setMe] = useState<HqMe | null>(null);
  const [nav, setNav] = useState<HqNavItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [bootstrap, setBootstrap] = useState(false);

  const reload = useCallback(() => {
    void fetch('/api/hims/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({}),
    }).then(async (response) => {
      if (!response.ok) throw new Error('session_unavailable');
      const body = await response.json() as HqMe;
      setMe(body);
      setNav(filterHqNav(body.permissions ?? [], (body.departments ?? []).map((row) => row.code)));
      setStatus('ready');
      setError('');
    }).catch(async (caught: Error) => {
      const check = await fetch('/api/hims/bootstrap', { credentials: 'same-origin' }).then((row) => row.json()).catch(() => ({}));
      setBootstrap(Boolean((check as { available?: boolean }).available));
      setError(caught.message);
      setStatus('error');
    });
  }, []);

  useEffect(() => {
    setStatus((current) => stayReadyDuringRefetch(current, 'loading', 'ready', me !== null));
    reload();
  }, [reload]);

  return { me, nav, status, error, bootstrap, reload };
}

export const HqSessionContext = createContext<ReturnType<typeof useHqSession> | null>(null);

export function useHqSessionContext() {
  const value = useContext(HqSessionContext);
  if (!value) {
    throw new Error('hq_session_required');
  }
  return value;
}

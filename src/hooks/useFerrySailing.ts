import { useEffect, useState } from 'react';
import { asPublicFerrySailing } from '@/domain/ferry-offer';
import type { FerrySailing } from '@/types';

export function useFerrySailing(sailingId: string | undefined) {
  const [sailing, setSailing] = useState<FerrySailing | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    if (!sailingId) {
      setSailing(null);
      setStatus('missing');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    void fetch(`/api/ferry/sailings/${sailingId}`, { credentials: 'same-origin' })
      .then(async (response) => {
        if (response.status === 404) {
          if (!cancelled) {
            setSailing(null);
            setStatus('missing');
          }
          return;
        }
        if (!response.ok) throw new Error('sailing_unavailable');
        const body = asPublicFerrySailing(await response.json());
        if (!cancelled) {
          setSailing(body);
          setStatus(body ? 'ready' : 'missing');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSailing(null);
          setStatus('missing');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sailingId]);

  return { sailing, status };
}

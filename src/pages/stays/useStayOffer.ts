import { useEffect, useState } from 'react';
import type { PublicStayOffer } from '@/domain/stay-offer';
import { isAbortError, queryFailureStatus, type QueryStatus } from '@/hooks/query-status';

export function useStayOffer(offerId: string) {
  const [status, setStatus] = useState<QueryStatus>(offerId ? 'loading' : 'ready');
  const [offer, setOffer] = useState<PublicStayOffer | null>(null);

  useEffect(() => {
    if (!offerId) {
      setOffer(null);
      setStatus('ready');
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    fetch(`/api/stays/offers/${encodeURIComponent(offerId)}`, { signal: controller.signal })
      .then((response) => {
        if (response.status === 404) {
          setOffer(null);
          setStatus('ready');
          return null;
        }
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ data?: PublicStayOffer }>;
      })
      .then((body) => {
        if (body === null) return;
        setOffer(body.data ?? null);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setStatus(queryFailureStatus(error));
      });
    return () => controller.abort();
  }, [offerId]);

  return { status, offer };
}

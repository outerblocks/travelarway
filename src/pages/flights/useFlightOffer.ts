import { useEffect, useState } from 'react';
import type { PublicAirOffer } from '@/domain/air-offer';
import { isAbortError, queryFailureStatus, stayReadyDuringRefetch, type QueryStatus } from '@/hooks/query-status';

export function useFlightOffer(offerId: string) {
  const [status, setStatus] = useState<QueryStatus>(offerId ? 'loading' : 'ready');
  const [offer, setOffer] = useState<PublicAirOffer | null>(null);

  useEffect(() => {
    if (!offerId) {
      setOffer(null);
      setStatus('ready');
      return;
    }
    const controller = new AbortController();
    setStatus((current) => stayReadyDuringRefetch(current, 'loading', 'ready', offer !== null));
    fetch(`/api/flights/offers/${encodeURIComponent(offerId)}`, { signal: controller.signal })
      .then((response) => {
        if (response.status === 404) {
          setOffer(null);
          setStatus('ready');
          return null;
        }
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ data?: PublicAirOffer }>;
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

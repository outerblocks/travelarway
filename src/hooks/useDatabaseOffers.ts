import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { destinationToken, originToken } from '@/domain/search-tokens';
import { useHydrateSearchFromUrl } from '@/hooks/useHydrateSearchFromUrl';
import { isAbortError, queryFailureStatus, stayReadyDuringRefetch, type QueryStatus } from '@/hooks/query-status';
import { useOnlineRetry } from '@/hooks/useOnlineRetry';
import { asPublicAirOffer, type PublicAirOffer } from '@/domain/air-offer';
import { asPublicStayOffer, type PublicStayOffer } from '@/domain/stay-offer';
import { asPublicFerrySailing } from '@/domain/ferry-offer';
import type { FerrySailing } from '@/types';

export type { PublicAirOffer, PublicStayOffer };

/**
 * Modes without local inventory tables resolve From/To against `app.location`.
 * Flights and stays may return GDS adapter offers. Nothing here falls back to mockData.
 */
export function useDatabaseOffers(mode: string) {
  useHydrateSearchFromUrl();
  const { bookingState } = useApp();
  const params = bookingState.searchParams;
  const from = originToken(params);
  const to = destinationToken(params);
  const [status, setStatus] = useState<QueryStatus>('loading');
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [flightOffers, setFlightOffers] = useState<PublicAirOffer[]>([]);
  const [stayOffers, setStayOffers] = useState<PublicStayOffer[]>([]);
  const [ferrySailings, setFerrySailings] = useState<FerrySailing[]>([]);
  const [bookable, setBookable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const needsPair = mode !== 'stays' && mode !== 'experiences';
    if (!from || (needsPair && !to)) {
      setUnresolved([]);
      setFlightOffers([]);
      setStayOffers([]);
      setFerrySailings([]);
      setStatus('ready');
      return;
    }

    const controller = new AbortController();
    setStatus((current) =>
      stayReadyDuringRefetch(
        current,
        'loading',
        'ready',
        flightOffers.length > 0 || stayOffers.length > 0 || ferrySailings.length > 0,
      ),
    );
    const search = new URLSearchParams({ mode, from });
    if (to) search.set('to', to);
    if (params.date) search.set('date', params.date);
    if (params.returnDate) search.set('returnDate', params.returnDate);
    if (params.extras?.checkOut) search.set('checkOut', params.extras.checkOut);
    search.set('adults', String(params.adults));
    search.set('children', String(params.children));
    search.set('infants', String(params.infants));
    if (params.extras?.rooms) search.set('rooms', params.extras.rooms);

    fetch(`/api/offers?${search.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{
          unresolved_places?: string[];
          data?: unknown[];
          bookable?: boolean;
        }>;
      })
      .then((body) => {
        setUnresolved(body.unresolved_places ?? []);
        setBookable(Boolean(body.bookable));
        if (mode === 'flights') {
          setFlightOffers(Array.isArray(body.data)
            ? body.data.flatMap((row) => {
              const offer = asPublicAirOffer(row);
              return offer ? [offer] : [];
            })
            : []);
        }
        else setFlightOffers([]);
        if (mode === 'stays') setStayOffers(Array.isArray(body.data) ? body.data.map(asPublicStayOffer) : []);
        else setStayOffers([]);
        if (mode === 'ferry') {
          setFerrySailings(Array.isArray(body.data)
            ? body.data.flatMap((row) => {
              const sailing = asPublicFerrySailing(row);
              return sailing ? [sailing] : [];
            })
            : []);
        } else setFerrySailings([]);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setStatus(queryFailureStatus(error));
      });

    return () => controller.abort();
  }, [mode, from, to, params.date, params.returnDate, params.adults, params.children, params.infants, params.extras, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useOnlineRetry(retry);

  return { status, unresolved, retry, params, from, to, flightOffers, stayOffers, ferrySailings, bookable };
}

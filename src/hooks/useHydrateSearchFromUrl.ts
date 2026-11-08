import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

/**
 * Results pages are shared as URLs. The search card puts location ids on the query
 * string so a refresh still hits the same database rows, not a display-name guess.
 */
export function useHydrateSearchFromUrl() {
  const { bookingState, setSearchParams } = useApp();
  const params = bookingState.searchParams;

  useEffect(() => {
    if (params.extras?.originId || params.origin || typeof window === 'undefined') return;
    const query = new URLSearchParams(window.location.search);
    const from = query.get('from')?.trim();
    const to = query.get('to')?.trim();
    if (!from && !to) return;
    const checkOut = query.get('checkOut')?.trim();
    const rooms = query.get('rooms')?.trim();
    setSearchParams({
      ...params,
      origin: query.get('fromName')?.trim() || from || params.origin,
      destination: query.get('toName')?.trim() || to || params.destination,
      date: query.get('date')?.trim() || params.date,
      extras: {
        ...params.extras,
        ...(from ? { originId: from } : {}),
        ...(to ? { destinationId: to } : {}),
        ...(checkOut ? { checkOut } : {}),
        ...(rooms ? { rooms } : {}),
      },
    });
  }, [params, setSearchParams]);
}

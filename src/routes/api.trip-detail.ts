import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { findTripDetail } from '@/server/search';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/trip-detail?id=<uuid>
 *
 * One trip's bookable shape: ordered stops, the fare for any stop pair, the seat layout,
 * and which seats are currently unavailable (live holds and sold seats combined).
 *
 * Kept as a query parameter rather than a path segment so the route stays a single file
 * and cannot drift from the generated route tree.
 */
export const Route = createFileRoute('/api/trip-detail')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;

        const params = new URL(request.url).searchParams;
        const id = params.get('id')?.trim() ?? '';
        if (!UUID.test(id)) {
          return Response.json({ error: 'invalid_trip' }, { status: 400 });
        }

        try {
          // Optional party: when supplied the server also prices the travelled segment, so
          // review and checkout can display the amount that will actually be charged.
          const from = params.get('from')?.trim() ?? '';
          const to = params.get('to')?.trim() ?? '';
          const adults = Number(params.get('adults') ?? '0');
          const children = Number(params.get('children') ?? '0');
          const party =
            from && to && Number.isInteger(adults) && Number.isInteger(children)
              ? { from, to, adults, children }
              : undefined;

          const trip = await findTripDetail(id, party);
          if (!trip) {
            return Response.json({ error: 'trip_not_found' }, { status: 404 });
          }
          // Seat availability changes with every hold, so this must never be cached.
          return Response.json({ data: trip }, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          // Log the cause: a bare 503 here previously hid a runtime TypeError and made a
          // code bug look like a data outage.
          console.error('[api/trip-detail] read failed:', error instanceof Error ? error.message : 'unknown error');
          return Response.json({ error: 'trip_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

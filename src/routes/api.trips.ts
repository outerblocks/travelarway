import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { findTrips } from '@/server/search';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CODE = /^[A-Za-z]{2,4}$/;

/**
 * GET /api/trips?from=DAR&to=DOM&date=2026-10-29
 *
 * Returns dated, priced trips for one origin/destination pair. Fixture rows carry
 * operatorSource: 'fixture' so the client can label them instead of presenting them as
 * live inventory.
 */
export const Route = createFileRoute('/api/trips')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        const params = new URL(request.url).searchParams;
        const from = params.get('from')?.trim() ?? '';
        const to = params.get('to')?.trim() ?? '';
        const date = params.get('date')?.trim() || new Date().toISOString().slice(0, 10);

        if (!CODE.test(from) || !CODE.test(to)) {
          return Response.json(
            { error: 'invalid_stops', detail: 'from and to must be 2–4 letter location codes' },
            { status: 400 },
          );
        }
        if (!DATE.test(date)) {
          return Response.json(
            { error: 'invalid_date', detail: 'date must be YYYY-MM-DD' },
            { status: 400 },
          );
        }
        if (from.toUpperCase() === to.toUpperCase()) {
          return Response.json(
            { error: 'same_stop', detail: 'origin and destination must differ' },
            { status: 400 },
          );
        }

        try {
          const trips = await findTrips({ from, to, date });
          return Response.json(
            { data: trips, count: trips.length, date },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch {
          return Response.json({ error: 'search_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

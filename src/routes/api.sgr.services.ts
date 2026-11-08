import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { findSgrServices } from '@/server/sgr/services';

export const Route = createFileRoute('/api/sgr/services')({
  server: {
    handlers: {
      /**
       *   GET /api/sgr/services?from=Dar es Salaam&to=Dodoma&date=2026-11-03
       *
       * An empty `services` array is a normal 200: no train running that corridor that day is
       * an answer, not a fault. A 400 is reserved for a request that could not be understood,
       * and a 503 for the database being unavailable, so the page can tell "nothing found"
       * apart from "we could not look".
       */
      GET: async ({ request }: { request: Request }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;

        const url = new URL(request.url);
        const from = url.searchParams.get('from')?.trim() ?? '';
        const to = url.searchParams.get('to')?.trim() ?? '';
        const date = url.searchParams.get('date')?.trim() ?? '';

        if (!from || !to) {
          return Response.json({ error: 'missing_places', detail: 'from and to are required.' }, { status: 400 });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return Response.json({ error: 'invalid_date', detail: 'date must be YYYY-MM-DD.' }, { status: 400 });
        }

        try {
          const { services, unresolved } = await findSgrServices({ from, to, date });
          return Response.json(
            {
              data: services,
              // Names the platform has no place row for. Reported rather than answered with an
              // empty list, so a typo or an unseeded station is not mistaken for "no trains".
              unresolved_places: unresolved,
            },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown error';
          if (message === 'invalid_date') {
            return Response.json({ error: 'invalid_date' }, { status: 400 });
          }
          if (message.includes('DATABASE_URL')) {
            return Response.json({ error: 'database_unconfigured' }, { status: 503 });
          }
          console.error('[api/sgr/services] search failed:', message);
          return Response.json({ error: 'search_failed' }, { status: 500 });
        }
      },
    },
  },
});

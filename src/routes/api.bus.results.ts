import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { searchBusResults } from '@/server/bus-results';
import { createSearchIntent } from '@/server/search-intent';
import { todayISO } from '@/utils/format';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/bus/results?from=Dar%20es%20Salaam&to=Dodoma&date=2026-10-30
 *
 * Accepts either a location code or its display name, because the search card stores
 * names while the API is easier to call with codes.
 */
export const Route = createFileRoute('/api/bus/results')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        const params = new URL(request.url).searchParams;
        const from = params.get('from')?.trim() ?? '';
        const to = params.get('to')?.trim() ?? '';
        // Local calendar day, never toISOString(): the platform serves Africa/Dar_es_Salaam,
        // which is UTC+3, so the UTC date turns over three hours before local midnight.
        const date = params.get('date')?.trim() || todayISO();
        const sort = params.get('sort')?.trim() ?? 'departure';

        if (!from || !to) {
          return Response.json(
            { error: 'missing_stops', detail: 'from and to are required' },
            { status: 400 },
          );
        }
        if (!DATE.test(date)) {
          return Response.json({ error: 'invalid_date' }, { status: 400 });
        }

        try {
          const results = await searchBusResults({ from, to, date, sort });
          let searchIntent: string | undefined;
          try {
            searchIntent = createSearchIntent(results.map((row) => row.id));
          } catch {
            searchIntent = undefined;
          }
          return Response.json(
            { data: results, count: results.length, date, from, to, sort, searchIntent },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          // Log the reason server-side (message only, never the connection string) and
          // return a coarse code, so a 503 is actionable instead of blind.
          const message = error instanceof Error ? error.message : 'unknown error';
          console.error('[api/bus/results] search failed:', message);
          const misconfigured = message.includes('DATABASE_URL');
          return Response.json(
            { error: misconfigured ? 'database_unconfigured' : 'search_unavailable' },
            { status: 503 },
          );
        }
      },
    },
  },
});

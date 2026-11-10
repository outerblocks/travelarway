import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { listPublicMarkets } from '@/server/markets';

/**
 * GET /api/markets
 *
 * Public point-of-sale catalogue. No secrets, no merchant credentials. Licensed
 * merchants expose collection methods; planned markets return empty methods so the
 * UI cannot start a collection that the server would refuse.
 */
export const Route = createFileRoute('/api/markets')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        try {
          const data = await listPublicMarkets();
          return Response.json(
            { data, count: data.length },
            { headers: { 'cache-control': 'public, max-age=60' } },
          );
        } catch {
          return Response.json({ error: 'markets_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

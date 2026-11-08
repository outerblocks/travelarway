import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { resolveProvider } from '@/server/sgr/provider';

export const Route = createFileRoute('/api/sgr/trips/$tripId/classes')({
  server: {
    handlers: {
      /**
       * Seats per class for one travel range: the answer the results list needs before
       * anyone picks a seat.
       *
       *   GET /api/sgr/trips/:tripId/classes?from=0&to=2
       */
      GET: async ({ params, request }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;

        const url = new URL(request.url);
        // Both bounds are required. Defaulting them to the whole journey would quietly
        // answer a different question than the one the passenger asked.
        const fromSeq = Number(url.searchParams.get('from'));
        const toSeq = Number(url.searchParams.get('to'));
        if (!Number.isInteger(fromSeq) || !Number.isInteger(toSeq) || toSeq <= fromSeq || fromSeq < 0) {
          return Response.json(
            { error: 'invalid_range', message: 'from and to must be integers with to greater than from.' },
            { status: 400 },
          );
        }

        try {
          const provider = await resolveProvider(params.tripId);
          const classes = await provider.getClassAvailability({
            tripId: params.tripId,
            fromSeq,
            toSeq,
          });
          return Response.json(
            { tripId: params.tripId, fromSeq, toSeq, seatSelection: provider.capabilities.perSeatHold ? 'PER_SEAT' : 'AUTO_ASSIGN', classes },
            { status: 200, headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.startsWith('trip_not_found')) {
            return Response.json({ error: 'trip_not_found' }, { status: 404 });
          }
          if (message.startsWith('inventory_mode_not_supported')) {
            return Response.json({ error: 'inventory_mode_not_supported' }, { status: 501 });
          }
          // Raised by the pool when DATABASE_URL is absent. Reported rather than caught as
          // a generic failure, because the fix is configuration, not a code change.
          if (message.includes('DATABASE_URL')) {
            return Response.json({ error: 'database_unconfigured' }, { status: 503 });
          }
          console.error('[api/sgr/trips/classes] read failed:', message);
          return Response.json({ error: 'availability_failed' }, { status: 500 });
        }
      },
    },
  },
});

import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { resolveProvider } from '@/server/sgr/provider';

export const Route = createFileRoute('/api/sgr/trips/$tripId/classes/$classCode/cars')({
  server: {
    handlers: {
      /**
       * The cars of one class, with per-seat state for a travel range.
       *
       *   GET /api/sgr/trips/:tripId/classes/BUSINESS/cars?from=0&to=2&holdId=...
       *
       * The response carries the whole class, not one coach: the arrows between cars, which
       * car is `full`, and which car to open first are all relationships between cars, and
       * computing them here means every screen agrees on them. The seat map draws a page at
       * a time even though all of them are known.
       *
       * `holdId` is optional and only marks the caller's own selections.
       */
      GET: async ({ params, request }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;

        const url = new URL(request.url);
        const fromSeq = Number(url.searchParams.get('from'));
        const toSeq = Number(url.searchParams.get('to'));
        if (!Number.isInteger(fromSeq) || !Number.isInteger(toSeq) || toSeq <= fromSeq || fromSeq < 0) {
          return Response.json(
            { error: 'invalid_range', message: 'from and to must be integers with to greater than from.' },
            { status: 400 },
          );
        }

        const classCode = params.classCode.toUpperCase();
        const holdId = url.searchParams.get('holdId') ?? undefined;

        try {
          const provider = await resolveProvider(params.tripId);
          if (!provider.capabilities.seatMap) {
            // Rather than a seat map of empty cars, which would read as an empty train.
            return Response.json({ seatClassCode: classCode, cars: [], seatSelection: 'AUTO_ASSIGN' }, { status: 200 });
          }

          const navigation = await provider.getCarSeatState({
            tripId: params.tripId,
            seatClassCode: classCode,
            fromSeq,
            toSeq,
            holdId,
          });
          return Response.json(navigation, { status: 200, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.startsWith('trip_not_found')) {
            return Response.json({ error: 'trip_not_found', tripId: params.tripId }, { status: 404 });
          }
          if (message.startsWith('class_not_found')) {
            // A class that is not a class at all, as distinct from a real class this trainset
            // does not carry — that case is a 200 with no cars.
            return Response.json({ error: 'class_not_found', seatClassCode: classCode }, { status: 404 });
          }
          if (message.startsWith('inventory_mode_not_supported')) {
            return Response.json({ error: 'inventory_mode_not_supported' }, { status: 501 });
          }
          if (message.includes('DATABASE_URL')) {
            return Response.json({ error: 'database_unconfigured' }, { status: 503 });
          }
          console.error('[api/sgr/trips/classes/cars] read failed:', message);
          return Response.json({ error: 'seat_state_failed' }, { status: 500 });
        }
      },
    },
  },
});

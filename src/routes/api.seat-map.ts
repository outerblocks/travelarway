import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { getLayoutByFamily, getTripSeatMap } from '@/server/seat-map';
import { resolveBusSegment } from '@/server/bus-segment';
import { query } from '@/server/db';
import { createSearchIntent } from '@/server/search-intent';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/seat-map?tripId=<uuid>          live availability for a departure
 * GET /api/seat-map?familyId=<uuid>&version=1   layout for the editor/library
 *
 * One endpoint because both callers need the same thing: cells plus seats, with geometry
 * owned by the database. `tripId` wins if both are supplied.
 */
export const Route = createFileRoute('/api/seat-map')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        const params = new URL(request.url).searchParams;
        const tripId = params.get('tripId')?.trim() ?? '';
        const familyId = params.get('familyId')?.trim() ?? '';
        const versionRaw = params.get('version');
        const version = versionRaw && /^\d+$/.test(versionRaw) ? Number(versionRaw) : undefined;

        if (!UUID.test(tripId) && !UUID.test(familyId)) {
          return Response.json(
            { error: 'invalid_request', detail: 'tripId or familyId must be a UUID' },
            { status: 400 },
          );
        }

        try {
          let interval: { fromSeq: number; toSeq: number } | undefined;
          const fromStopId = params.get('fromStopId')?.trim() ?? '';
          const toStopId = params.get('toStopId')?.trim() ?? '';
          if (UUID.test(tripId) && UUID.test(fromStopId) && UUID.test(toStopId)) {
            const segment = await resolveBusSegment(query, tripId, fromStopId, toStopId);
            if (segment) interval = { fromSeq: segment.fromSeq, toSeq: segment.toSeq };
          }
          const seatMap = UUID.test(tripId)
            ? await getTripSeatMap(tripId, interval)
            : await getLayoutByFamily(familyId, version);

          if (!seatMap) {
            return Response.json({ error: 'seat_map_not_found' }, { status: 404 });
          }

          // Availability changes with every hold, so this is never cached.
          let searchIntent: string | undefined;
          try {
            if (UUID.test(tripId)) searchIntent = createSearchIntent([tripId]);
          } catch {
            searchIntent = undefined;
          }
          return Response.json(
            {
              data: seatMap,
              searchIntent,
              counts: {
                seats: seatMap.seats.length,
                held: seatMap.seats.filter((seat) => seat.status === 'held').length,
                booked: seatMap.seats.filter((seat) => seat.status === 'booked').length,
              },
            },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown error';
          console.error('[api/seat-map] read failed:', message);
          return Response.json({ error: 'seat_map_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

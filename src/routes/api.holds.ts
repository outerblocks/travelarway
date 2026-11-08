import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import {
  assertHoldAccessConfigured,
  createHoldReleaseToken,
  holdReleaseTokenFromRequest,
  readHoldReleaseToken,
} from '@/server/hold-access';
import {
  createHold,
  releaseHold,
  SeatUnavailableError,
  TripNotFoundError,
  TripUnavailableError,
} from '@/server/holds';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/holds   { tripId, seats: string[], ttlSeconds? }
 * DELETE /api/holds?holdId=…  (requires x-hold-release token issued at create)
 *
 * 201 when every requested seat is held, 409 when any is already held or sold — with
 * the offending seats listed, so the client can offer a different seat rather than fail
 * the whole basket mysteriously.
 */
export const Route = createFileRoute('/api/holds')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'holds');
        if (limited) return limited;

        try {
          assertHoldAccessConfigured();
        } catch {
          console.error('[api/holds] BOOKING_ACCESS_SECRET not configured');
          return Response.json({ error: 'holds_unavailable' }, { status: 503 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        const input = body as { tripId?: unknown; seats?: unknown; ttlSeconds?: unknown };
        const tripId = typeof input.tripId === 'string' ? input.tripId : '';
        const seats = Array.isArray(input.seats)
          ? input.seats.filter((seat): seat is string => typeof seat === 'string')
          : [];

        if (!UUID.test(tripId)) {
          return Response.json({ error: 'invalid_trip' }, { status: 400 });
        }
        if (seats.length === 0 || seats.length > 8) {
          return Response.json({ error: 'invalid_seats', detail: '1–8 seats per hold' }, { status: 400 });
        }

        const ttlSeconds =
          typeof input.ttlSeconds === 'number' && input.ttlSeconds >= 60 && input.ttlSeconds <= 1800
            ? input.ttlSeconds
            : undefined;

        try {
          const hold = await createHold({ tripId, seats, ttlSeconds });
          const releaseTokens = Object.fromEntries(
            hold.holdIds.map((id) => [id, createHoldReleaseToken(id)]),
          );
          return Response.json(
            { ...hold, releaseTokens },
            { status: 201, headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          if (error instanceof SeatUnavailableError) {
            return Response.json(
              { error: 'seat_unavailable', seats: error.seats },
              { status: 409, headers: { 'cache-control': 'no-store' } },
            );
          }
          if (error instanceof TripNotFoundError) {
            return Response.json({ error: 'trip_not_found' }, { status: 404 });
          }
          if (error instanceof TripUnavailableError) {
            return Response.json({ error: 'trip_unavailable' }, { status: 409 });
          }
          return Response.json({ error: 'hold_failed' }, { status: 503 });
        }
      },

      DELETE: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'holds');
        if (limited) return limited;

        const holdId = new URL(request.url).searchParams.get('holdId') ?? '';
        if (!UUID.test(holdId)) {
          return Response.json({ error: 'invalid_hold' }, { status: 400 });
        }
        let tokenHoldId: string | null = null;
        try {
          tokenHoldId = readHoldReleaseToken(holdReleaseTokenFromRequest(request))?.holdId ?? null;
        } catch {
          console.error('[api/holds] BOOKING_ACCESS_SECRET not configured');
          return Response.json({ error: 'holds_unavailable' }, { status: 503 });
        }
        if (tokenHoldId !== holdId) {
          return Response.json({ error: 'bad_release_token' }, { status: 403 });
        }
        try {
          const released = await releaseHold(holdId);
          return Response.json({ released }, { status: released ? 200 : 404 });
        } catch {
          return Response.json({ error: 'release_failed' }, { status: 503 });
        }
      },
    },
  },
});

import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { randomUUID } from 'node:crypto';
import {
  assertHoldAccessConfigured,
  createHoldReleaseToken,
  holdReleaseTokenFromRequest,
  readHoldReleaseToken,
} from '@/server/hold-access';
import { releaseHold, SeatUnavailableError } from '@/server/sgr/inventory';
import { resolveProvider } from '@/server/sgr/provider';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * How long a seat hold lasts, in seconds.
 *
 * Read from the environment rather than fixed in code: the window has to be long enough for
 * a USSD approval on a poor signal and short enough that a abandoned basket does not starve
 * the train. Those numbers change with the payment provider, and a redeploy should not be the
 * way to change them.
 */
const HOLD_TTL_SECONDS = Math.max(60, Number(process.env.SGR_HOLD_TTL_SECONDS ?? 300) || 300);
const MAX_SEATS_PER_HOLD = 8;

export const Route = createFileRoute('/api/sgr/holds')({
  server: {
    handlers: {
      /**
       * POST /api/sgr/holds
       *   { tripId, holdKey, seats: [{coachNo, seatNumber}], fromSeq, toSeq, ttlSeconds? }
       *
       * 201 when every seat is held for the requested interval, 409 with the offending seats
       * listed when any of them is not. The client is told which seat failed rather than being
       * told the basket failed, so it can offer a neighbouring seat instead of dumping the
       * passenger back to the start.
       *
       * `holdKey` is the client's idempotency key: retrying after a timeout re-joins the same
       * hold rather than taking a second one.
       */
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'holds');
        if (limited) return limited;

        try {
          assertHoldAccessConfigured();
        } catch {
          console.error('[api/sgr/holds] BOOKING_ACCESS_SECRET not configured');
          return Response.json({ error: 'holds_unavailable' }, { status: 503 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        const input = body as Record<string, unknown>;
        const tripId = typeof input.tripId === 'string' ? input.tripId : '';
        const holdKey = typeof input.holdKey === 'string' && input.holdKey ? input.holdKey : randomUUID();
        const fromSeq = Number(input.fromSeq);
        const toSeq = Number(input.toSeq);
        const rawSeats = Array.isArray(input.seats) ? input.seats : [];
        const seats = rawSeats
          .map((entry) => entry as Record<string, unknown>)
          .filter((entry) => Number.isInteger(entry.coachNo) && Number.isInteger(entry.seatNumber))
          .map((entry) => ({ coachNo: Number(entry.coachNo), seatNumber: Number(entry.seatNumber) }));

        if (!UUID.test(tripId)) {
          return Response.json({ error: 'invalid_trip' }, { status: 400 });
        }
        if (seats.length === 0 || seats.length > MAX_SEATS_PER_HOLD) {
          return Response.json({ error: 'invalid_seats', max: MAX_SEATS_PER_HOLD }, { status: 400 });
        }
        if (!Number.isInteger(fromSeq) || !Number.isInteger(toSeq) || toSeq <= fromSeq || fromSeq < 0) {
          return Response.json({ error: 'invalid_range' }, { status: 400 });
        }

        const ttl = Number.isInteger(input.ttlSeconds)
          ? Math.min(Math.max(Number(input.ttlSeconds), 60), 3_600)
          : HOLD_TTL_SECONDS;

        try {
          const provider = await resolveProvider(tripId);
          const held = await provider.holdSeats({
            tripId,
            holdKey,
            seats,
            fromSeq,
            toSeq,
            ttlSeconds: ttl,
            createdBy: typeof input.createdBy === 'string' ? input.createdBy : undefined,
          });

          return Response.json(
            {
              holdId: held.holdId,
              releaseToken: createHoldReleaseToken(held.holdId),
              seats: held.seats,
              reused: held.reused,
              ttlSeconds: ttl,
            },
            { status: held.reused ? 200 : 201, headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          if (error instanceof SeatUnavailableError) {
            return Response.json(
              { error: 'seats_unavailable', seats: error.seats },
              { status: 409, headers: { 'cache-control': 'no-store' } },
            );
          }
          const message = error instanceof Error ? error.message : 'unknown error';
          if (message.startsWith('trip_not_found')) {
            return Response.json({ error: 'trip_not_found' }, { status: 404 });
          }
          if (message.startsWith('inventory_mode_not_supported')) {
            return Response.json({ error: 'inventory_mode_not_supported' }, { status: 501 });
          }
          if (message.includes('DATABASE_URL')) {
            return Response.json({ error: 'database_unconfigured' }, { status: 503 });
          }
          console.error('[api/sgr/holds] refused:', message);
          return Response.json({ error: 'hold_failed' }, { status: 500 });
        }
      },

      /**
       * DELETE /api/sgr/holds?holdId=…
       *
       * Releasing is best-effort and always answers 204: a client that has already navigated
       * away cannot act on a failure, and the expiry sweeper will free the seat regardless.
       */
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
          return Response.json({ error: 'holds_unavailable' }, { status: 503 });
        }
        if (tokenHoldId !== holdId) {
          return Response.json({ error: 'bad_release_token' }, { status: 403 });
        }
        try {
          await releaseHold(holdId);
        } catch (error) {
          console.error('[api/sgr/holds] release failed:', error instanceof Error ? error.message : error);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});

/**
 * Seat holds.
 *
 * A hold is temporary, not a booking: it reserves capacity for a few minutes so a
 * passenger can pay. The database, not this module, is the authority on whether a seat
 * can be taken — ux_seat_hold_active rejects a second active hold on the same seat, and
 * ux_seat_sold_once rejects a second active passenger. This code reports those failures
 * as domain errors instead of leaking driver codes to the caller.
 */
import { withTransaction } from '@/server/db';
import { isUniqueViolation, TripNotFoundError } from '@/server/errors';

// Re-exported so existing route imports keep working; the class itself is shared.
export { TripNotFoundError };

export class TripUnavailableError extends Error {
  constructor() {
    super('trip_unavailable');
  }
}

export class SeatUnavailableError extends Error {
  constructor(public readonly seats: string[]) {
    super('seat_unavailable');
  }
}

export interface HoldResult {
  holdIds: string[];
  seats: string[];
  expiresAt: string;
}

export async function createHold(input: {
  tripId: string;
  seats: string[];
  ttlSeconds?: number;
}): Promise<HoldResult> {
  const ttl = input.ttlSeconds ?? 600;
  const seats = [...new Set(input.seats.map((seat) => seat.trim().toUpperCase()).filter(Boolean))];

  if (seats.length === 0) throw new SeatUnavailableError(seats);

  return withTransaction(async (client) => {
    const trip = await client.query<{ status: string }>(
      'select status from app.trip where id = $1',
      [input.tripId],
    );
    if (trip.rowCount === 0) throw new TripNotFoundError();
    if (trip.rows[0].status !== 'scheduled') throw new TripUnavailableError();

    // A seat already sold is not merely held — check the sold side too, so the error is
    // accurate rather than surfacing later as a booking conflict.
    const sold = await client.query<{ seat_no: string }>(
      `select seat_no from app.booking_passenger
        where trip_id = $1 and status = 'active' and seat_no = any($2::text[])`,
      [input.tripId, seats],
    );
    if ((sold.rowCount ?? 0) > 0) {
      throw new SeatUnavailableError(sold.rows.map((row) => row.seat_no));
    }

    // Expired holds must not block a seat forever, even before the sweeper runs.
    await client.query(
      `update app.seat_hold
          set status = 'expired'
        where trip_id = $1 and seat_no = any($2::text[])
          and status = 'active' and expires_at <= now()`,
      [input.tripId, seats],
    );

    try {
      const inserted = await client.query<{ id: string; expires_at: Date }>(
        `insert into app.seat_hold (trip_id, seat_no, expires_at)
         select $1, unnest($2::text[]), now() + make_interval(secs => $3)
         returning id, expires_at`,
        [input.tripId, seats, ttl],
      );

      return {
        holdIds: inserted.rows.map((row) => row.id),
        seats,
        expiresAt: inserted.rows[0].expires_at.toISOString(),
      };
    } catch (error) {
      if (isUniqueViolation(error)) throw new SeatUnavailableError(seats);
      throw error;
    }
  });
}

/** Release a hold explicitly (abandoned checkout). Idempotent. */
export async function releaseHold(holdId: string): Promise<boolean> {
  return withTransaction(async (client) => {
    const result = await client.query(
      `update app.seat_hold set status = 'released'
        where id = $1 and status = 'active'`,
      [holdId],
    );
    return (result.rowCount ?? 0) > 0;
  });
}

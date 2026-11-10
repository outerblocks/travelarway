/**
 * Seat holds.
 *
 * A hold is temporary, not a booking: it reserves a numbered seat across a stop interval
 * for a few minutes so a passenger can pay. The database exclusion constraint, not this
 * module, is the authority on whether two intervals overlap.
 */
import { withTransaction } from '@/server/db';
import { isInventoryConflict, TripNotFoundError } from '@/server/errors';
import { resolveBusSegment } from '@/server/bus-segment';
import { resolveSeatsForTrip } from '@/server/seat-map';

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

export class SegmentNotPermittedError extends Error {
  constructor() {
    super('segment_not_permitted');
  }
}

export interface HoldResult {
  holdIds: string[];
  seats: string[];
  expiresAt: string;
  fromStopId: string;
  toStopId: string;
}

export async function createHold(input: {
  tripId: string;
  fromStopId: string;
  toStopId: string;
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

    const segment = await resolveBusSegment(client, input.tripId, input.fromStopId, input.toStopId);
    if (!segment) throw new SegmentNotPermittedError();

    const resolved = await resolveSeatsForTrip(client, input.tripId, seats);
    const canonical = resolved.map((seat) => seat.label);

    const sold = await client.query<{ seat_no: string }>(
      `select seat_no from app.booking_passenger
        where trip_id = $1 and status in ('pending', 'active') and seat_no = any($2::text[])
          and from_seq < $4 and to_seq > $3`,
      [input.tripId, canonical, segment.fromSeq, segment.toSeq],
    );
    if ((sold.rowCount ?? 0) > 0) {
      throw new SeatUnavailableError(sold.rows.map((row) => row.seat_no));
    }

    await client.query(
      `update app.seat_hold
          set status = 'expired'
        where trip_id = $1 and seat_no = any($2::text[])
          and status = 'active' and expires_at <= now()
          and from_seq < $4 and to_seq > $3`,
      [input.tripId, canonical, segment.fromSeq, segment.toSeq],
    );

    try {
      const inserted = await client.query<{ id: string; expires_at: Date }>(
        `insert into app.seat_hold
           (trip_id, seat_no, seat_id, expires_at, from_stop_id, to_stop_id, from_seq, to_seq)
         select $1, x.label, x.id, now() + make_interval(secs => $3), $5, $6, $7, $8
           from unnest($2::uuid[], $4::text[]) as x(id, label)
         returning id, expires_at`,
        [
          input.tripId,
          resolved.map((seat) => seat.id),
          ttl,
          resolved.map((seat) => seat.label),
          segment.fromStopId,
          segment.toStopId,
          segment.fromSeq,
          segment.toSeq,
        ],
      );

      return {
        holdIds: inserted.rows.map((row) => row.id),
        seats: canonical,
        expiresAt: inserted.rows[0].expires_at.toISOString(),
        fromStopId: segment.fromStopId,
        toStopId: segment.toStopId,
      };
    } catch (error) {
      if (isInventoryConflict(error)) throw new SeatUnavailableError(seats);
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

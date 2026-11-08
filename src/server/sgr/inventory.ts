import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { withTransaction, query } from '@/server/db';
import { findPublishedTrainset } from '@/server/sgr/layout-repository';

/**
 * SGR seat inventory: materialise, hold, confirm, release.
 *
 * The rule that governs all of it: **the database decides whether two claims overlap.**
 * `sgr_seat_segments` carries an exclusion constraint that refuses a HELD/SOLD interval
 * crossing an existing one on the same seat. Every function here therefore claims by
 * inserting and lets a constraint violation mean "someone else got it first".
 *
 * The tempting alternative — read the segments, decide in JavaScript, then write — is wrong
 * under concurrency, and it is wrong in exactly the way that is invisible in development:
 * two requests both read "available", both decide they may proceed, both write, and one
 * passenger is told at the platform that the seat they paid for belongs to someone else.
 * Nothing in this file does a check-then-insert.
 */

export class SeatUnavailableError extends Error {
  constructor(public readonly seats: { coachNo: number; seatNumber: number }[]) {
    super('seats_unavailable');
  }
}

export class HoldNotFoundError extends Error {
  constructor() {
    super('hold_not_found');
  }
}

/** A seat a caller wants, named the way the operator names it. */
export interface SeatRequest {
  coachNo: number;
  seatNumber: number;
}

interface HoldRow {
  id: string;
  hold_key: string;
  trip_id: string;
  expires_at: Date;
  status: string;
}

/**
 * Creates a trip from a trainset's published layouts.
 *
 * The layout is **copied** into the trip rather than referenced. A coach interior that
 * changes next month must not change the meaning of a seat sold today, and a manifest
 * printed at boarding has to agree with what the passenger was shown when they booked.
 *
 * `allocation` is the set of seats Travelar may sell. Seats on the train that are not in it
 * still exist on the map — drawn as not sellable — because hiding them would misreport the
 * coach as empty.
 */
export async function materialiseTrip(input: {
  serviceRef: string;
  trainsetCode: string;
  originStationId: string;
  destinationStationId: string;
  /** EXPRESS / ROYAL_EXPRESS / ORDINARY_LINE. Prices differ by pattern on one corridor. */
  servicePattern?: string;
  stops: { stationId: string; seq: number; arrivesAt?: Date; departsAt?: Date }[];
  departsAt: Date;
  arrivesAt: Date;
  /** Seat keys as "coach:seat". Omit to be allocated every seat the trainset has. */
  allocation?: string[];
}): Promise<{ tripId: string; seats: number }> {
  const trainset = await findPublishedTrainset(input.trainsetCode);
  if (!trainset) throw new Error(`trainset_unavailable:${input.trainsetCode}`);

  const allocated = input.allocation ? new Set(input.allocation) : null;
  const snapshot = trainset.coaches;

  return withTransaction(async (client) => {
    const trip = await client.query<{ id: string }>(
      `insert into app.sgr_trips
         (service_ref, trainset_type_id, origin_station_id, destination_station_id,
          departs_at, arrives_at, layout_snapshot, status, service_pattern)
       select $1, t.id, $2, $3, $4, $5, $6::jsonb, 'ON_SALE', $7
         from app.sgr_trainset_types t
        where t.code = $8
      returning id`,
      [
        input.serviceRef,
        input.originStationId,
        input.destinationStationId,
        input.departsAt,
        input.arrivesAt,
        JSON.stringify(snapshot),
        input.servicePattern ?? null,
        input.trainsetCode,
      ],
    );
    const tripId = trip.rows[0]?.id;
    if (!tripId) throw new Error('trip_creation_failed');

    for (const stop of input.stops) {
      await client.query(
        `insert into app.sgr_trip_stops (trip_id, station_id, seq, arrives_at, departs_at)
         values ($1, $2, $3, $4, $5)`,
        [tripId, stop.stationId, stop.seq, stop.arrivesAt ?? null, stop.departsAt ?? null],
      );
    }

    let seats = 0;
    for (const coach of snapshot) {
      for (const seat of coach.seats) {
        const key = `${coach.coachNo}:${seat.seatNumber}`;
        const sellable = allocated === null || allocated.has(key);
        await client.query(
          `insert into app.sgr_trip_seats
             (trip_id, coach_no, seat_number, seat_class_id, seat_label, position, seat_kind, sellable)
           select $1, $2, $3, sc.id, $4, $5::text, $6, $7
             from app.sgr_seat_classes sc
            where sc.code = $8`,
          [
            tripId,
            coach.coachNo,
            seat.seatNumber,
            seat.seatLabel,
            seat.position,
            seat.seatKind ?? 'STANDARD',
            sellable,
            coach.classCode,
          ],
        );
        seats += 1;

        // One wide AVAILABLE row per seat, covering the whole journey. Claims then split it
        // rather than needing a row per possible stop pair, which for a dozen stops would be
        // seventy-two rows per seat before anyone had booked anything.
        if (sellable) {
          await client.query(
            `insert into app.sgr_seat_segments (trip_seat_id, from_seq, to_seq, state)
             select s.id, 0, $2, 'AVAILABLE'
               from app.sgr_trip_seats s
              where s.trip_id = $1 and s.coach_no = $3 and s.seat_number = $4`,
            [tripId, input.stops.length - 1, coach.coachNo, seat.seatNumber],
          );
        }
      }
    }

    return { tripId, seats };
  });
}

/**
 * Holds seats for a travel range. Idempotent on `holdKey`.
 *
 * All or nothing: a passenger who asked for two adjacent seats and got one is worse off than
 * one who got none, so the transaction rolls back entirely on any conflict.
 *
 * The retry-on-conflict that a caller might want is deliberately absent. Retrying a refused
 * claim would turn a genuine "someone took it" into an infinite loop against the constraint.
 */
export async function holdSeats(input: {
  tripId: string;
  holdKey: string;
  seats: SeatRequest[];
  fromSeq: number;
  toSeq: number;
  /** Held for how long. Passed in rather than hardcoded: the payment window is a config value. */
  ttlSeconds: number;
  createdBy?: string;
}): Promise<{ holdId: string; seats: SeatRequest[]; reused: boolean }> {
  if (input.seats.length === 0) throw new Error('no_seats_requested');
  if (input.toSeq <= input.fromSeq) throw new Error('invalid_travel_range');
  if (input.ttlSeconds <= 0) throw new Error('invalid_ttl');

  return withTransaction(async (client) => {
    const existing = await client.query<HoldRow>(
      `select id, hold_key, trip_id, expires_at, status::text
         from app.sgr_holds where hold_key = $1`,
      [input.holdKey],
    );

    if (existing.rowCount) {
      const hold = existing.rows[0];
      if (hold.trip_id !== input.tripId) throw new Error('hold_key_reused_for_other_trip');
      const claimed = await client.query<{ coach_no: number; seat_number: number }>(
        `select s.coach_no, s.seat_number
           from app.sgr_seat_segments g
           join app.sgr_trip_seats s on s.id = g.trip_seat_id
          where g.hold_id = $1
          order by s.coach_no, s.seat_number`,
        [hold.id],
      );
      // The same key returns the same answer, including after a client timed out and retried.
      return {
        holdId: hold.id,
        seats: claimed.rows.map((row) => ({ coachNo: row.coach_no, seatNumber: row.seat_number })),
        reused: true,
      };
    }

    const expiresAt = new Date(Date.now() + input.ttlSeconds * 1000);
    const created = await client.query<{ id: string }>(
      `insert into app.sgr_holds (id, hold_key, trip_id, expires_at, created_by)
       values ($1, $2, $3, $4, $5) returning id`,
      [randomUUID(), input.holdKey, input.tripId, expiresAt, input.createdBy ?? 'api'],
    );
    const holdId = created.rows[0].id;

    for (const seat of input.seats) {
      // Split the seat's AVAILABLE coverage around the requested range, then claim the
      // middle. The exclusion constraint is what decides whether this seat is free.
      const target = await client.query<{ id: string }>(
        `select s.id
           from app.sgr_trip_seats s
          where s.trip_id = $1 and s.coach_no = $2 and s.seat_number = $3 and s.sellable`,
        [input.tripId, seat.coachNo, seat.seatNumber],
      );
      const tripSeatId = target.rows[0]?.id;
      if (!tripSeatId) throw new SeatUnavailableError([seat]);

      try {
        await client.query(
          `insert into app.sgr_seat_segments (trip_seat_id, from_seq, to_seq, state, hold_id, hold_expires_at)
           values ($1, $2, $3, 'HELD', $4, $5)`,
          [tripSeatId, input.fromSeq, input.toSeq, holdId, expiresAt],
        );
      } catch (error) {
        if ((error as { code?: string }).code === '23P01') throw new SeatUnavailableError([seat]);
        throw error;
      }

      // Shrink the covering AVAILABLE row so it no longer spans the claimed range. Done
      // after the claim so a refused insert leaves the seat exactly as it was.
      await client.query(
        `delete from app.sgr_seat_segments
          where trip_seat_id = $1 and state = 'AVAILABLE' and from_seq = $2 and to_seq = $3`,
        [tripSeatId, input.fromSeq, input.toSeq],
      );
      const leftover = await client.query<{ from_seq: number; to_seq: number }>(
        `select from_seq, to_seq from app.sgr_seat_segments
          where trip_seat_id = $1 and state = 'AVAILABLE'
            and from_seq < $2 and to_seq > $3`,
        [tripSeatId, input.fromSeq, input.toSeq],
      );
      for (const row of leftover.rows) {
        await client.query(
          `update app.sgr_seat_segments set to_seq = $2 where trip_seat_id = $1 and state = 'AVAILABLE' and from_seq = $3 and to_seq = $4`,
          [tripSeatId, input.fromSeq, row.from_seq, row.to_seq],
        );
        await client.query(
          `insert into app.sgr_seat_segments (trip_seat_id, from_seq, to_seq, state)
           values ($1, $2, $3, 'AVAILABLE')`,
          [tripSeatId, input.toSeq, row.to_seq],
        );
      }
    }

    return { holdId, seats: input.seats, reused: false };
  });
}

/** HELD → SOLD. Only an unexpired hold converts; an expired one has already been released. */
export async function confirmHold(input: { holdId: string; bookingItemId: string }): Promise<{ seats: number }> {
  return withTransaction(async (client) => {
    const held = await client.query<{ id: string }>(
      `select g.id from app.sgr_seat_segments g
        join app.sgr_holds h on h.id = g.hold_id
        where g.hold_id = $1 and g.state = 'HELD' and h.status = 'HELD' and h.expires_at > now()
        for update of g`,
      [input.holdId],
    );
    if (held.rowCount === 0) throw new HoldNotFoundError();

    await client.query(
      `update app.sgr_seat_segments
          set state = 'SOLD', booking_item_id = $2, hold_id = null, hold_expires_at = null, updated_at = now()
        where hold_id = $1 and state = 'HELD'`,
      [input.holdId, input.bookingItemId],
    );
    await client.query(`update app.sgr_holds set status = 'CONFIRMED', updated_at = now() where id = $1`, [input.holdId]);

    return { seats: held.rowCount ?? 0 };
  });
}

/**
 * Returns one claimed interval to AVAILABLE, merged with whatever AVAILABLE neighbours touch it
 * on either side.
 *
 * Absorbing both neighbours (rather than extending one) is what keeps a seat that is held and
 * released many times from fragmenting into a confetti of one-stop rows. Must run inside the
 * caller's transaction: the claim's own row is deleted first, and a crash between that delete
 * and this insert outside a transaction would lose the interval for good.
 */
async function returnToAvailable(
  client: pg.PoolClient,
  tripSeatId: string,
  fromSeq: number,
  toSeq: number,
): Promise<void> {
  const left = await client.query<{ from_seq: number }>(
    `delete from app.sgr_seat_segments
      where trip_seat_id = $1 and state = 'AVAILABLE' and to_seq = $2
      returning from_seq`,
    [tripSeatId, fromSeq],
  );
  const right = await client.query<{ to_seq: number }>(
    `delete from app.sgr_seat_segments
      where trip_seat_id = $1 and state = 'AVAILABLE' and from_seq = $2
      returning to_seq`,
    [tripSeatId, toSeq],
  );
  const start = Math.min(fromSeq, ...left.rows.map((row) => row.from_seq));
  const end = Math.max(toSeq, ...right.rows.map((row) => row.to_seq));
  await client.query(
    `insert into app.sgr_seat_segments (trip_seat_id, from_seq, to_seq, state)
     values ($1, $2, $3, 'AVAILABLE')`,
    [tripSeatId, start, end],
  );
}

/**
 * Frees a hold's claims and re-coalesces the seat's availability.
 *
 * The released range is merged back into its neighbours where they touch, so a seat held and
 * released many times does not end up as a confetti of one-stop rows.
 *
 * `finalStatus` lets the expiry sweeper record EXPIRED rather than RELEASED: the two are
 * different facts for reporting (abandoned checkout versus a customer who let the clock run).
 */
export async function releaseHold(
  holdId: string,
  finalStatus: 'RELEASED' | 'EXPIRED' = 'RELEASED',
): Promise<{ released: number }> {
  return withTransaction(async (client) => {
    const claimed = await client.query<{ id: string; trip_seat_id: string; from_seq: number; to_seq: number }>(
      `delete from app.sgr_seat_segments
        where hold_id = $1 and state = 'HELD'
        returning id, trip_seat_id, from_seq, to_seq`,
      [holdId],
    );

    for (const segment of claimed.rows) {
      await returnToAvailable(client, segment.trip_seat_id, segment.from_seq, segment.to_seq);
    }

    await client.query(
      `update app.sgr_holds set status = $2, updated_at = now() where id = $1 and status = 'HELD'`,
      [holdId, finalStatus],
    );
    return { released: claimed.rowCount ?? 0 };
  });
}

/**
 * Releases everything whose hold has run out.
 *
 * Returns the count rather than logging only, because a sweeper that never reports is how a
 * seat stays blocked for hours while the dashboard looks healthy.
 */
export async function releaseExpiredHolds(): Promise<{ expired: number }> {
  const due = await query<{ id: string }>(
    `select id from app.sgr_holds where status = 'HELD' and expires_at <= now()`,
  );
  let expired = 0;
  for (const hold of due.rows) {
    const result = await releaseHold(hold.id, 'EXPIRED');
    if (result.released > 0) expired += 1;
  }
  return { expired };
}

/**
 * SOLD → AVAILABLE for a booking item, subject to whatever refund policy the caller applies.
 *
 * One transaction: freeing the sold rows and re-inserting availability must commit together,
 * or a failure between them leaves a seat neither sold nor sellable.
 */
export async function cancelBookingSeats(bookingItemId: string): Promise<{ freed: number }> {
  return withTransaction(async (client) => {
    const sold = await client.query<{ trip_seat_id: string; from_seq: number; to_seq: number }>(
      `delete from app.sgr_seat_segments
        where booking_item_id = $1 and state = 'SOLD'
        returning trip_seat_id, from_seq, to_seq`,
      [bookingItemId],
    );

    for (const segment of sold.rows) {
      await returnToAvailable(client, segment.trip_seat_id, segment.from_seq, segment.to_seq);
    }

    return { freed: sold.rowCount ?? 0 };
  });
}

import { createHash } from 'node:crypto';
import { query, withOperatorTransaction } from '@/server/db';
import { isInventoryConflict, isUniqueViolation } from '@/server/errors';
import { resolveBusSegment } from '@/server/bus-segment';
import { claimFerryCapacity } from '@/server/sailing-inventory';
import { quoteBusSegment, quoteFerryClass, QuoteUnavailableError } from '@/server/quote';
import { recordSale } from '@/server/ledger';
import { assertModeMatch, assertTripTenant, rejectClientTotal } from '@/server/oims/permissions';
import { OimsConflictError, OimsForbiddenError } from '@/server/oims/repository';
import { resolveSeatsForTrip } from '@/server/seat-map';
import { stampBookingPos } from '@/server/markets';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makePnr = (): string =>
  `TRV-${Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')}`;

export async function quoteOtc(input: {
  operatorId: string;
  consoleMode: 'bus' | 'ferry';
  tripId: string;
  fromStopId?: string;
  toStopId?: string;
  vesselClassId?: string;
  adults: number;
  children: number;
}) {
  const trip = await query<{ operator_id: string; mode: string; status: string; pipeline: string }>(
    `select t.operator_id, o.mode, t.status, o.pipeline_status as pipeline
       from app.trip t join app.operator o on o.id = t.operator_id
      where t.id = $1`,
    [input.tripId],
  );
  const row = trip.rows[0];
  if (!row) throw new Error('invalid_trip');
  assertTripTenant(row.operator_id, input.operatorId);
  assertModeMatch(row.mode, input.consoleMode);
  if (row.pipeline !== 'active') throw new OimsForbiddenError();
  if (row.status !== 'scheduled') throw new OimsConflictError('trip_unavailable');
  if (input.consoleMode === 'bus') {
    if (!input.fromStopId || !input.toStopId) throw new Error('invalid_segment');
    return quoteBusSegment({
      tripId: input.tripId,
      fromStopId: input.fromStopId,
      toStopId: input.toStopId,
      adults: input.adults,
      children: input.children,
    });
  }
  if (!input.vesselClassId) throw new Error('invalid_segment');
  return quoteFerryClass({
    tripId: input.tripId,
    vesselClassId: input.vesselClassId,
    adults: input.adults,
    children: input.children,
  });
}

export async function sellOtc(input: {
  operatorId: string;
  actor: string;
  consoleMode: 'bus' | 'ferry';
  tripId: string;
  fromStopId?: string;
  toStopId?: string;
  vesselClassId?: string;
  seats?: string[];
  customerName: string;
  customerPhone: string;
  passengers: { fullName: string; category: 'adult' | 'child'; seatNo?: string }[];
  body: Record<string, unknown>;
}) {
  rejectClientTotal(input.body);
  if (!input.customerName.trim()) throw new Error('invalid_customer');
  const adults = input.passengers.filter((row) => row.category === 'adult').length;
  const children = input.passengers.filter((row) => row.category === 'child').length;
  const quote = await quoteOtc({
    operatorId: input.operatorId,
    consoleMode: input.consoleMode,
    tripId: input.tripId,
    fromStopId: input.fromStopId,
    toStopId: input.toStopId,
    vesselClassId: input.vesselClassId,
    adults,
    children,
  });

  return withOperatorTransaction(input.operatorId, async (client) => {
    const trip = await client.query<{ operator_id: string; mode: string; country_code: string; status: string }>(
      `select t.operator_id, o.mode, o.country_code, t.status
         from app.trip t join app.operator o on o.id = t.operator_id
        where t.id = $1
        for update of t`,
      [input.tripId],
    );
    const row = trip.rows[0];
    if (!row) throw new Error('invalid_trip');
    assertTripTenant(row.operator_id, input.operatorId);
    assertModeMatch(row.mode, input.consoleMode);
    if (row.status !== 'scheduled') throw new OimsConflictError('trip_unavailable');

    const seats = [...new Set((input.seats ?? []).map((seat) => seat.trim().toUpperCase()).filter(Boolean))];
    const seatKey = input.consoleMode === 'bus' ? seats.join(',') : String(input.vesselClassId ?? '');
    const idempotencyKey = createHash('sha256')
      .update(`${input.actor}|${input.tripId}|${seatKey}`)
      .digest('hex');
    const prior = await client.query<{ booking_id: string; pnr: string }>(
      `select i.booking_id, b.pnr
         from app.otc_idempotency i
         join app.booking b on b.id = i.booking_id
        where i.idempotency_key = $1`,
      [idempotencyKey],
    );
    if (prior.rows[0]) {
      return {
        bookingId: prior.rows[0].booking_id,
        pnr: prior.rows[0].pnr,
        quotedMinor: quote.grossMinor,
        currency: quote.currency,
        status: 'issued',
        replayed: true,
      };
    }
    let resolved: { id: string; label: string }[] = [];
    let busSegment: { fromStopId: string; toStopId: string; fromSeq: number; toSeq: number } | null = null;
    if (input.consoleMode === 'bus') {
      if (seats.length !== input.passengers.length) throw new Error('invalid_seats');
      if (!input.fromStopId || !input.toStopId) throw new Error('invalid_segment');
      busSegment = await resolveBusSegment(client, input.tripId, input.fromStopId, input.toStopId);
      if (!busSegment) throw new Error('invalid_segment');
      resolved = await resolveSeatsForTrip(client, input.tripId, seats);
      await client.query(
        `update app.seat_hold set status = 'expired'
          where trip_id = $1 and seat_no = any($2::text[]) and status = 'active' and expires_at <= now()
            and from_seq < $4 and to_seq > $3`,
        [input.tripId, resolved.map((seat) => seat.label), busSegment.fromSeq, busSegment.toSeq],
      );
    } else {
      if (!input.vesselClassId) throw new Error('invalid_segment');
      const claimed = await claimFerryCapacity(
        client,
        input.tripId,
        input.vesselClassId,
        input.passengers.length,
      );
      if (!claimed) throw new OimsConflictError('class_full');
    }

    let bookingId: string | null = null;
    let pnr = '';
    for (let attempt = 0; attempt < 5 && !bookingId; attempt += 1) {
      pnr = makePnr();
      try {
        const created = await client.query<{ id: string }>(
          `insert into app.booking (
             pnr, operator_id, trip_id, status, channel, total_minor, currency,
             customer_name, customer_phone, paid_at, issued_at, source
           ) values ($1, $2, $3, 'issued', 'otc', $4, $5, $6, $7, now(), now(), 'operator_contract')
           returning id`,
          [pnr, input.operatorId, input.tripId, quote.grossMinor, quote.currency, input.customerName.trim(), input.customerPhone.trim() || null],
        );
        bookingId = created.rows[0]!.id;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    if (!bookingId) throw new Error('pnr_generation_failed');
    await stampBookingPos(client, bookingId, input.operatorId);

    try {
    for (let index = 0; index < input.passengers.length; index += 1) {
      const passenger = input.passengers[index]!;
      const fare = passenger.category === 'adult' ? quote.adultUnitMinor : quote.childUnitMinor;
      await client.query(
        `insert into app.booking_passenger (
           booking_id, trip_id, full_name, category, seat_no, seat_id, fare_minor, status,
           from_stop_id, to_stop_id, from_seq, to_seq, vessel_class_id, phone
         ) values ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11, $12, $13)`,
        [
          bookingId,
          input.tripId,
          passenger.fullName.trim() || input.customerName.trim(),
          passenger.category,
          input.consoleMode === 'bus' ? resolved[index]?.label ?? null : null,
          input.consoleMode === 'bus' ? resolved[index]?.id ?? null : null,
          fare,
          busSegment?.fromStopId ?? input.fromStopId ?? null,
          busSegment?.toStopId ?? input.toStopId ?? null,
          busSegment?.fromSeq ?? null,
          busSegment?.toSeq ?? null,
          input.vesselClassId ?? null,
          input.customerPhone.trim() || null,
        ],
      );
    }
    } catch (error) {
      if (isInventoryConflict(error)) throw new OimsConflictError('seat_unavailable');
      throw error;
    }

    await recordSale(client, {
      bookingId,
      pnr,
      operatorId: input.operatorId,
      mode: row.mode,
      countryCode: row.country_code,
      grossMinor: quote.grossMinor,
      currency: quote.currency,
      collection: 'otc_cash',
    });

    await client.query(
      `insert into app.booking_event (booking_id, type, payload, actor)
       values ($1, 'booking.issued', $2, $3)`,
      [bookingId, JSON.stringify({ channel: 'otc', pnr, collection: 'otc_cash' }), input.actor],
    );
    await client.query(
      `insert into app.otc_idempotency (idempotency_key, operator_id, actor, trip_id, booking_id)
       values ($1, $2, $3, $4, $5)`,
      [idempotencyKey, input.operatorId, input.actor, input.tripId, bookingId],
    );
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'otc.sell', 'booking', $3, $4::jsonb)`,
      [input.operatorId, input.actor, bookingId, JSON.stringify({ pnr, tripId: input.tripId })],
    );

    return { bookingId, pnr, quotedMinor: quote.grossMinor, currency: quote.currency, status: 'issued' };
  });
}

export async function reprintOtc(input: {
  operatorId: string;
  actor: string;
  bookingId: string;
  reason: string;
}) {
  if (!input.reason.trim()) throw new Error('invalid_reason');
  return withOperatorTransaction(input.operatorId, async (client) => {
    const found = await client.query<{ pnr: string; operator_id: string; channel: string }>(
      `select pnr, operator_id, channel from app.booking where id = $1`,
      [input.bookingId],
    );
    const row = found.rows[0];
    if (!row || row.operator_id !== input.operatorId) throw new OimsForbiddenError();
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'otc.reprint', 'booking', $3, $4::jsonb)`,
      [input.operatorId, input.actor, input.bookingId, JSON.stringify({ reason: input.reason.trim(), pnr: row.pnr })],
    );
    return { pnr: row.pnr, reprinted: true };
  });
}

export async function requestOtcVoid(input: {
  operatorId: string;
  actorUserId: string;
  actor: string;
  bookingId: string;
  reason: string;
}) {
  const found = await query<{ operator_id: string; channel: string }>(
    `select operator_id, channel from app.booking where id = $1`,
    [input.bookingId],
  );
  const row = found.rows[0];
  if (!row || row.operator_id !== input.operatorId) throw new OimsForbiddenError();
  const { submitQuotedRefund } = await import('@/server/hims/work');
  return submitQuotedRefund({
    actorUserId: input.actorUserId,
    actor: input.actor,
    bookingId: input.bookingId,
    reason: input.reason,
  });
}

export { QuoteUnavailableError, rejectClientTotal };

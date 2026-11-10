/**
 * Booking commit.
 *
 * A hold becomes a booking inside one transaction: the seats must be held, the booking and
 * its passengers are written, the holds are bound to the booking, and an audit event
 * records it. If any step fails the whole thing rolls back — a booking with no consumed
 * hold, or a hold bound to no booking, is worse than a failed request.
 *
 * This module deliberately issues nothing. A booking starts `pending_payment`; the ticket,
 * the ledger row and the sale itself happen in `payments.confirmPayment` when a provider
 * confirms the money. Writing them here would record revenue for an abandoned checkout.
 */
import { query, withTransaction } from '@/server/db';
import { isUniqueViolation, TripNotFoundError } from '@/server/errors';
import { resolveBusSegment } from '@/server/bus-segment';

// Re-exported so existing route imports keep working; the class itself is shared.
export { TripNotFoundError };
import { quoteBusSegment, QuoteUnavailableError } from '@/server/quote';
import { resolveSeatsForTrip } from '@/server/seat-map';
import { expireIfDue } from '@/server/expiry';
import { createBookingAccessToken, assertBookingAccessConfigured } from '@/server/booking-access';
import { stampBookingPos } from '@/server/markets';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** How long a customer has to pay before the seats are released. */
export const PAYMENT_WINDOW_MINUTES = 15;

const makePnr = (): string =>
  `TRV-${Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')}`;

export class SeatsNotHeldError extends Error {
  constructor(public readonly seats: string[]) {
    super('seats_not_held');
  }
}

export interface BookingPassengerInput {
  fullName: string;
  category: 'adult' | 'child' | 'infant';
  seatNo: string;
}

export interface CreateBookingInput {
  tripId: string;
  /** The travelled segment. The server prices it; the request never states a total. */
  fromStopId: string;
  toStopId: string;
  seats: string[];
  passengers: BookingPassengerInput[];
  adults: number;
  children: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface CreateBookingResult {
  bookingId: string;
  pnr: string;
  seats: string[];
  totalMinor: number;
  currency: string;
  /** Always `pending_payment`. Nothing has been paid and no ticket exists yet. */
  status: string;
  /** When these seats are released if the money does not arrive. */
  paymentDueAt: string;
  /**
   * Proof that this browser created the booking. Required to read it or start its payment:
   * a booking id appears in URLs and logs, so it cannot be the only credential.
   */
  accessToken: string;
}

export class BookingNotConfiguredError extends Error {
  constructor(public readonly variable: string) {
    super(`booking_not_configured:${variable}`);
  }
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  // Before touching a seat: a deployment without the signing key cannot issue a booking,
  // and saying so at the top is better than failing after the inventory work.
  try {
    assertBookingAccessConfigured();
  } catch {
    throw new BookingNotConfiguredError('BOOKING_ACCESS_SECRET');
  }

    const seats = [...new Set(input.seats.map((seat) => seat.trim().toUpperCase()).filter(Boolean))];

    return withTransaction(async (client) => {
    const trip = await client.query<{ operator_id: string; status: string; mode: string; country_code: string }>(
      `select t.operator_id, t.status, o.mode, o.country_code
         from app.trip t join app.operator o on o.id = t.operator_id
        where t.id = $1`,
      [input.tripId],
    );
    if (trip.rowCount === 0) throw new TripNotFoundError();
    const resolved = await resolveSeatsForTrip(client, input.tripId, seats);
    const canonical = resolved.map((seat) => seat.label);
    const seatIdByLabel = new Map(resolved.map((seat) => [seat.label.toUpperCase(), seat.id]));

    // Every seat must still be held by an unexpired hold. This is the check that stops a
    // client from booking seats it never reserved.
    const segment = await resolveBusSegment(client, input.tripId, input.fromStopId, input.toStopId);
    if (!segment) throw new QuoteUnavailableError('no_such_segment');

    const held = await client.query<{ seat_no: string }>(
      `select seat_no from app.seat_hold
        where trip_id = $1 and status = 'active' and expires_at > now()
          and seat_no = any($2::text[])
          and from_seq = $3 and to_seq = $4`,
      [input.tripId, canonical, segment.fromSeq, segment.toSeq],
    );
    const heldSeats = new Set(held.rows.map((row) => row.seat_no.toUpperCase()));
    const missing = canonical.filter((seat) => !heldSeats.has(seat.toUpperCase()));
    if (missing.length > 0) throw new SeatsNotHeldError(missing);

    // The amount owed is computed from segment_fare inside this transaction. Nothing in the
    // request body is allowed to state a price, so a tampered client cannot book a 29,000
    // seat for 1 and have the ledger believe it.
    const quote = await quoteBusSegment({
      tripId: input.tripId,
      fromStopId: input.fromStopId,
      toStopId: input.toStopId,
      adults: input.adults,
      children: input.children,
    });
    const fareFor = (category: string) =>
      category === 'adult' ? quote.adultUnitMinor : quote.childUnitMinor;

    let bookingId: string | null = null;
    let pnr = '';
    let paymentDueAt: Date | null = null;
    for (let attempt = 0; attempt < 5 && !bookingId; attempt += 1) {
      pnr = makePnr();
      try {
        const created = await client.query<{ id: string; payment_due_at: Date }>(
          `insert into app.booking
             (pnr, operator_id, trip_id, status, total_minor, currency,
              customer_name, customer_email, customer_phone, payment_due_at)
           values ($1, $2, $3, 'pending_payment', $4, $5, $6, $7, $8,
                   now() + make_interval(mins => $9))
           returning id, payment_due_at`,
          [
            pnr,
            trip.rows[0].operator_id,
            input.tripId,
            quote.grossMinor,
            quote.currency,
            input.customerName,
            input.customerEmail,
            input.customerPhone,
            PAYMENT_WINDOW_MINUTES,
          ],
        );
        bookingId = created.rows[0].id;
        paymentDueAt = created.rows[0].payment_due_at;
      } catch (error) {
        // Two customers can generate the same PNR. Retry rather than fail the sale.
        if (!isUniqueViolation(error)) throw error;
      }
    }
    if (!bookingId || !paymentDueAt) throw new Error('pnr_generation_failed');
    await stampBookingPos(client, bookingId, trip.rows[0].operator_id);

    for (const passenger of input.passengers) {
      await client.query(
        `insert into app.booking_passenger
           (booking_id, trip_id, full_name, category, seat_no, seat_id, fare_minor, status,
            from_stop_id, to_stop_id, from_seq, to_seq)
         values ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11)`,
        [
          bookingId,
          input.tripId,
          passenger.fullName,
          passenger.category,
          passenger.seatNo.trim().toUpperCase(),
          seatIdByLabel.get(passenger.seatNo.trim().toUpperCase()) ?? null,
          fareFor(passenger.category),
          segment.fromStopId,
          segment.toStopId,
          segment.fromSeq,
          segment.toSeq,
        ],
      );
    }

    // The holds stay active: they are what keeps the seats unavailable while the customer
    // pays, and they expire on their own if the customer never does. Binding them to the
    // booking is what lets a confirmed payment find and consume them.
    await client.query(
      `update app.seat_hold set booking_id = $1
        where trip_id = $2 and status = 'active' and seat_no = any($3::text[])
          and from_seq = $4 and to_seq = $5`,
      [bookingId, input.tripId, canonical, segment.fromSeq, segment.toSeq],
    );

    await client.query(
      `insert into app.booking_event (booking_id, type, payload, actor)
       values ($1, 'booking.created', $2, 'api')`,
      [
        bookingId,
        JSON.stringify({
          pnr,
          seats: canonical,
          totalMinor: quote.grossMinor,
          currency: quote.currency,
          paymentDueAt: paymentDueAt.toISOString(),
        }),
      ],
    );

    return {
      bookingId,
      pnr,
      seats: canonical,
      totalMinor: quote.grossMinor,
      currency: quote.currency,
      status: 'pending_payment',
      paymentDueAt: paymentDueAt.toISOString(),
      accessToken: createBookingAccessToken({ bookingId }),
    };
  });
}

export interface BookingStatusDto {
  bookingId: string;
  pnr: string;
  status: string;
  totalMinor: number;
  currency: string;
  paymentDueAt: string | null;
  paidAt: string | null;
  issuedAt: string | null;
  seats: string[];
  tripId: string;
  serviceDate: string;
  operatorName: string;
  routeName: string;
  payment: { status: string; method: string | null } | null;
}

/**
 * Reads a booking's current state.
 *
 * Deliberately does not return a ticket token: the caller decides whether the booking is
 * issued before minting one, and a token handed out for an unpaid booking is a boarding
 * pass to a seat nobody bought.
 */
export async function findBooking(bookingId: string): Promise<BookingStatusDto | null> {
  const { rows } = await query<{
    booking_id: string;
    pnr: string;
    status: string;
    total_minor: string;
    currency: string;
    payment_due_at: Date | null;
    paid_at: Date | null;
    issued_at: Date | null;
    trip_id: string;
    service_date: string;
    operator_name: string;
    route_name: string;
    seats: string[];
    payment_status: string | null;
    payment_method: string | null;
  }>(
    `select b.id as booking_id, b.pnr, b.status::text, b.total_minor::text, b.currency::text,
            b.payment_due_at, b.paid_at, b.issued_at,
            t.id as trip_id, to_char(t.service_date, 'YYYY-MM-DD') as service_date,
            o.name as operator_name, r.name as route_name,
            coalesce(
              (select array_agg(bp.seat_no order by bp.seat_no)
                 from app.booking_passenger bp
                where bp.booking_id = b.id and bp.seat_no is not null),
              '{}'::text[]
            ) as seats,
            p.status::text as payment_status,
            p.method       as payment_method
       from app.booking b
       join app.trip t     on t.id = b.trip_id
       join app.operator o on o.id = b.operator_id
       join app.route r    on r.id = t.route_id
       left join lateral (
         select status, method from app.payment
          where booking_id = b.id
          order by created_at desc limit 1
       ) p on true
      where b.id = $1`,
    [bookingId],
  );

  if (rows.length === 0) return null;
  const row = rows[0];

  // A read must not report a deadline that has already passed as still pending: the page
  // would tell the customer their seats are held. Expire it here, and answer with what is
  // now true. The sweeper does the same transition in bulk for bookings nobody opens.
  if (
    row.status === 'pending_payment' &&
    row.payment_due_at &&
    row.payment_due_at.getTime() <= Date.now() &&
    (await expireIfDue(row.booking_id))
  ) {
    row.status = 'expired';
  }

  return {
    bookingId: row.booking_id,
    pnr: row.pnr,
    status: row.status,
    totalMinor: Number(row.total_minor),
    currency: row.currency,
    paymentDueAt: row.payment_due_at?.toISOString() ?? null,
    paidAt: row.paid_at?.toISOString() ?? null,
    issuedAt: row.issued_at?.toISOString() ?? null,
    seats: row.seats,
    tripId: row.trip_id,
    serviceDate: row.service_date,
    operatorName: row.operator_name,
    routeName: row.route_name,
    payment: row.payment_status
      ? { status: row.payment_status, method: row.payment_method }
      : null,
  };
}

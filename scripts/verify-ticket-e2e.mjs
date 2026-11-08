/**
 * End-to-end ticket verification check against a running server.
 *
 *   node scripts/verify-ticket-e2e.mjs [baseUrl]
 *
 * Books two seats through the real endpoints, proves that creating a booking issues no
 * ticket, then confirms payment the way a provider callback would and scans the ticket
 * the way a conductor would. The forged scan MUST be refused; if it is accepted the QR on
 * the ticket proves nothing.
 *
 * The callback is signed with PAYMENT_CALLBACK_SECRET from .env, so the script exercises
 * the same authentication path a real provider would.
 */
import { createHmac } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const base = process.argv[2] ?? 'http://localhost:5431';
const date = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);

const json = (path, init) =>
  fetch(`${base}${path}`, init).then(async (response) => ({
    status: response.status,
    body: await response.json().catch(() => null),
  }));

const post = (path, payload) =>
  json(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

const results = await json(`/api/bus/results?from=dar&to=dodoma&date=${date}`);
const trip = results.body?.data?.[0];
if (!trip) {
  console.log(JSON.stringify({ ok: false, reason: 'no-trip', status: results.status }));
  process.exit(1);
}

// Pick seats that are actually free, so the check can be run repeatedly against a
// database that already holds bookings from previous runs.
const seatMap = await json(`/api/seat-map?tripId=${trip.id}`);
const seats = (seatMap.body?.data?.seats ?? [])
  .filter((seat) => seat.status === 'available')
  .slice(0, 2)
  .map((seat) => seat.label);

if (seats.length !== 2) {
  console.log(JSON.stringify({ ok: false, reason: 'no-free-seats', seats }));
  process.exit(1);
}

// The server prices the journey, so the check needs the actual stop ids for the travelled
// segment rather than an amount invented here.
const detail = await json(`/api/trip-detail?id=${trip.id}`);
const stops = detail.body?.data?.stops ?? [];
const fromStop = stops.find((stop) => stop.locationName === 'Dar es Salaam');
const toStop = stops.find((stop) => stop.locationName === 'Dodoma');
if (!fromStop || !toStop) {
  console.log(JSON.stringify({ ok: false, reason: 'no-segment', stops: stops.map((s) => s.locationName) }));
  process.exit(1);
}

const held = await post('/api/holds', { tripId: trip.id, seats });
if (held.status !== 201) {
  console.log(JSON.stringify({ ok: false, reason: 'hold-failed', held }));
  process.exit(1);
}

const booked = await post('/api/bookings', {
  tripId: trip.id,
  fromStopId: fromStop.id,
  toStopId: toStop.id,
  seats,
  adults: 2,
  children: 0,
  customerName: 'QR E2E',
  customerEmail: 'qr@example.com',
  customerPhone: '255700000009',
  passengers: [
    { fullName: 'QR E2E', category: 'adult', seatNo: seats[0] },
    { fullName: 'Second Pax', category: 'adult', seatNo: seats[1] },
  ],
});

// The price must come from the server. A response with no total means the client would
// have had to supply one, which is the defect this closes.
if (typeof booked.body?.totalMinor !== 'number' || booked.body.totalMinor <= 0) {
  console.log(JSON.stringify({ ok: false, reason: 'no-server-total', body: booked.body }));
  process.exit(1);
}

// ── 1. A booking is not a sale ─────────────────────────────────────────────────
// Creating it must issue no ticket and no revenue: the old flow wrote `issued` and a
// ledger row the moment the form was submitted.
const bookingId = booked.body?.bookingId ?? '';
const accessToken = booked.body?.accessToken ?? '';
const beforePayment = await json(`/api/booking-status?token=${encodeURIComponent(accessToken)}`);
const noTicketYet =
  booked.body?.status === 'pending_payment' &&
  !booked.body?.verifyToken &&
  beforePayment.body?.status === 'pending_payment' &&
  beforePayment.body?.verifyToken === null;

// ── 2. The attempt exists, and nothing has been confirmed ──────────────────────
// The attempt is written directly rather than through `/api/payments/start`: with live
// credentials that call sends a real USSD push, and this script is about the booking→
// payment→ticket path, not about the adapter's request shape (unit-tested against a stub).
const orderReference = `${booked.body.pnr.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}01`;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  `insert into app.payment
     (booking_id, provider, method, amount_minor, currency, order_reference, provider_reference, status)
   values ($1, 'clickpesa', 'mobile_money', $2::bigint, $3, $4, $5, 'pending')`,
  [
    bookingId,
    booked.body.totalMinor,
    booked.body.currency,
    orderReference,
    `TEST-${Date.now()}`,
  ],
);

// The page's own memory of "we started a payment" does not survive a reload. The server
// must say so, or a customer who refreshes is invited to pay a second time.
const inFlight = await json(`/api/booking-status?token=${encodeURIComponent(accessToken)}`);

const callbackBody = JSON.stringify({
  orderReference,
  amountMinor: booked.body.totalMinor,
  currency: booked.body.currency,
  paidAt: new Date().toISOString(),
});
const sign = (body) =>
  createHmac('sha256', process.env.PAYMENT_CALLBACK_SECRET ?? '').update(body).digest('hex');

const unsigned = await json('/api/payments/callback', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: callbackBody,
});

const confirmed = await json('/api/payments/callback', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-travelar-signature': sign(callbackBody) },
  body: callbackBody,
});

const replay = await json('/api/payments/callback', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-travelar-signature': sign(callbackBody) },
  body: callbackBody,
});

// ── 4. The sale is now real ────────────────────────────────────────────────────
const afterPayment = await json(`/api/booking-status?token=${encodeURIComponent(accessToken)}`);
const token = afterPayment.body?.verifyToken ?? '';

const ledger = await client.query(
  `select count(*)::int as rows, max(gross_minor)::text as gross, max(revenue_minor)::text as revenue
     from app.ledger_entry where booking_id = $1 and reverses is null`,
  [bookingId],
);
await client.end();

// 5. Genuine scan.
const scan = await json(`/api/verify-ticket?token=${encodeURIComponent(token)}`);

// 6. Forged signature: flip the tail of the signature, keep the payload intact.
const forged = `${token.slice(0, token.lastIndexOf('.') + 1)}${'A'.repeat(
  Math.max(1, token.length - token.lastIndexOf('.') - 1),
)}`;
const tampered = await json(`/api/verify-ticket?token=${encodeURIComponent(forged)}`);

// 7. A bare PNR must not be accepted as a scan.
const bare = await json(`/api/verify-ticket?token=${encodeURIComponent(booked.body?.pnr ?? '')}`);

// ── 8. Money that arrives after the seats are gone ────────────────────────────
// The nastiest real case: the customer pays, but their hold expired first. That money is
// real and owes a refund, so it must be recorded as `unallocated` — never dropped, never
// turned into a ticket for a seat somebody else may now hold.
const secondSeatMap = await json(`/api/seat-map?tripId=${trip.id}`);
const laterSeats = (secondSeatMap.body?.data?.seats ?? [])
  .filter((seat) => seat.status === 'available')
  .slice(0, 1)
  .map((seat) => seat.label);

const lateHeld = await post('/api/holds', { tripId: trip.id, seats: laterSeats });
const lateBooking = await post('/api/bookings', {
  tripId: trip.id,
  fromStopId: fromStop.id,
  toStopId: toStop.id,
  seats: laterSeats,
  adults: 1,
  children: 0,
  customerName: 'Late Payer',
  customerEmail: 'late@example.com',
  customerPhone: '255700000010',
  passengers: [{ fullName: 'Late Payer', category: 'adult', seatNo: laterSeats[0] }],
});

const lateOrderReference = `${lateBooking.body.pnr.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}01`;

const lateClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
await lateClient.connect();
await lateClient.query(
  `insert into app.payment
     (booking_id, provider, method, amount_minor, currency, order_reference, provider_reference, status)
   values ($1, 'clickpesa', 'mobile_money', $2::bigint, $3, $4, $5, 'pending')`,
  [
    lateBooking.body.bookingId,
    lateBooking.body.totalMinor,
    lateBooking.body.currency,
    lateOrderReference,
    `TEST-LATE-${Date.now()}`,
  ],
);
// The hold lapses while the customer is in their mobile-money menu.
await lateClient.query(
  `update app.seat_hold set status = 'expired' where booking_id = $1`,
  [lateBooking.body.bookingId],
);

const lateBody = JSON.stringify({
  orderReference: lateOrderReference,
  amountMinor: lateBooking.body.totalMinor,
  currency: lateBooking.body.currency,
  paidAt: new Date().toISOString(),
});
const lateConfirmed = await json('/api/payments/callback', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-travelar-signature': sign(lateBody) },
  body: lateBody,
});

const lateState = await lateClient.query(
  `select b.status::text as booking_status, p.status::text as payment_status,
          (select count(*)::int from app.ledger_entry where booking_id = b.id) as ledger_rows
     from app.booking b join app.payment p on p.booking_id = b.id
    where b.id = $1`,
  [lateBooking.body.bookingId],
);
await lateClient.end();

const unallocatedHandled =
  lateHeld.status === 201 &&
  lateBooking.status === 201 &&
  lateConfirmed.status === 200 &&
  lateConfirmed.body?.paymentStatus === 'unallocated' &&
  lateConfirmed.body?.bookingStatus === 'cancelled' &&
  lateState.rows[0].payment_status === 'unallocated' &&
  lateState.rows[0].booking_status === 'cancelled' &&
  // No ticket, no revenue: nothing was sold.
  lateState.rows[0].ledger_rows === 0;

const ok =
  noTicketYet &&
  beforePayment.body?.paymentInFlight === false &&
  inFlight.body?.paymentInFlight === true &&
  unsigned.status === 401 &&
  confirmed.status === 200 &&
  confirmed.body?.bookingStatus === 'issued' &&
  confirmed.body?.paymentStatus === 'paid' &&
  confirmed.body?.replay === false &&
  // A replayed webhook must not write a second ledger row.
  replay.status === 200 &&
  replay.body?.replay === true &&
  ledger.rows[0].rows === 1 &&
  Number(ledger.rows[0].gross) === booked.body.totalMinor &&
  Number(ledger.rows[0].revenue) > 0 &&
  afterPayment.body?.status === 'issued' &&
  token.length > 20 &&
  scan.status === 200 &&
  scan.body?.valid === true &&
  scan.body?.pnr === booked.body?.pnr &&
  scan.body?.passengers?.length === 2 &&
  tampered.status === 403 &&
  bare.status === 403 &&
  unallocatedHandled;

console.log(
  JSON.stringify(
    {
      ok,
      pnr: booked.body?.pnr,
      bookingStatusBeforePayment: beforePayment.body?.status,
      ticketBeforePayment: beforePayment.body?.verifyToken,
      inFlightFlag: { before: beforePayment.body?.paymentInFlight, after: inFlight.body?.paymentInFlight },
      orderReference,
      unsignedCallbackStatus: unsigned.status,
      confirmed: { status: confirmed.status, ...confirmed.body },
      replay: { status: replay.status, replay: replay.body?.replay },
      ledger: ledger.rows[0],
      tokenLength: token.length,
      scan: { status: scan.status, valid: scan.body?.valid, seats: scan.body?.passengers?.map((p) => p.seat) },
      tamperedStatus: tampered.status,
      barePnrStatus: bare.status,
      latePayment: {
        confirmed: lateConfirmed.body,
        booking: lateState.rows[0],
      },
    },
    null,
    2,
  ),
);
if (!ok) process.exitCode = 1;

/**
 * ClickPesa webhook proof against a running server.
 *
 *   node scripts/verify-clickpesa-webhook.mjs [baseUrl]
 *
 * Exercises `/api/payments/clickpesa` with ClickPesa's own payload shape:
 *
 *   1. a correctly checksummed PAYMENT RECEIVED issues the ticket and writes one ledger row;
 *   2. the same payload replayed changes nothing;
 *   3. a payload tampered with after signing is refused (401) before any amount logic runs;
 *   4. a correctly checksummed PAYMENT FAILED marks the attempt failed but leaves the
 *      booking's payment window open for a retry;
 *   5. an unknown order reference is not acknowledged.
 *
 * The checksum here is computed by a deliberately separate implementation. If it agrees
 * with the server's, both follow the documented algorithm; if the server's ever drifts,
 * this fails instead of quietly accepting payloads ClickPesa would sign differently.
 *
 * No money moves. The script never calls `/api/payments/start`, because with live
 * credentials that would send a real USSD push. It creates the pending attempt directly and
 * exercises the webhook handler, which is what this script is about; the adapter's own
 * request shapes are covered by unit tests against a stub fetch.
 */
import { createHmac } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const base = process.argv[2] ?? 'http://localhost:5431';
const date = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
const secret = process.env.CLICKPESA_CHECKSUM_SECRET ?? '';

if (secret.length < 16) {
  console.log(JSON.stringify({ ok: false, reason: 'CLICKPESA_CHECKSUM_SECRET missing' }));
  process.exit(1);
}

const json = (path, init) =>
  fetch(`${base}${path}`, init).then(async (response) => ({
    status: response.status,
    body: await response.json().catch(() => null),
  }));

const post = (path, payload, headers = {}) =>
  json(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });

/** Independent re-implementation of ClickPesa's documented canonicalisation. */
function canonical(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonical);
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = canonical(value[key]);
      return acc;
    }, {});
}

function sign(payload) {
  const { checksum, checksumMethod, ...rest } = payload;
  const body = JSON.stringify(canonical(rest));
  return createHmac('sha256', secret).update(body).digest('hex');
}

async function webhook(payload) {
  return post('/api/payments/clickpesa', { ...payload, checksum: sign(payload) });
}

const results = await json(`/api/bus/results?from=dar&to=dodoma&date=${date}`);
const trip = results.body?.data?.[0];
if (!trip) {
  console.log(JSON.stringify({ ok: false, reason: 'no-trip' }));
  process.exit(1);
}

const detail = await json(`/api/trip-detail?id=${trip.id}`);
const stops = detail.body?.data?.stops ?? [];
const fromStop = stops.find((stop) => stop.locationName === 'Dar es Salaam');
const toStop = stops.find((stop) => stop.locationName === 'Dodoma');

const freeSeats = async (count) => {
  const map = await json(`/api/seat-map?tripId=${trip.id}`);
  return (map.body?.data?.seats ?? [])
    .filter((seat) => seat.status === 'available')
    .slice(0, count)
    .map((seat) => seat.label);
};

async function startBooking(name) {
  const seats = await freeSeats(1);
  const held = await post('/api/holds', { tripId: trip.id, seats });
  if (held.status !== 201) return { error: `hold ${held.status}` };

  const booked = await post('/api/bookings', {
    tripId: trip.id,
    fromStopId: fromStop.id,
    toStopId: toStop.id,
    seats,
    adults: 1,
    children: 0,
    customerName: name,
    customerEmail: `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
    customerPhone: '255700000012',
    passengers: [{ fullName: name, category: 'adult', seatNo: seats[0] }],
  });
  if (booked.status !== 201) return { error: `booking ${booked.status}` };

  // One attempt, written directly: no provider call, so no push and no charge. The reference
  // follows the same rule the application uses (`PNR` without punctuation + attempt).
  const orderReference = `${booked.body.pnr.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}01`;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    `insert into app.payment
       (booking_id, provider, method, amount_minor, currency, order_reference, provider_reference, status)
     values ($1, 'clickpesa', 'mobile_money', $2::bigint, $3, $4, $5, 'pending')`,
    [
      booked.body.bookingId,
      booked.body.totalMinor,
      booked.body.currency,
      orderReference,
      `TEST-${Date.now()}`,
    ],
  );
  await client.end();

  return {
    bookingId: booked.body.bookingId,
    pnr: booked.body.pnr,
    seat: seats[0],
    totalMinor: booked.body.totalMinor,
    currency: booked.body.currency,
    orderReference,
  };
}

// ── 1. A correct PAYMENT RECEIVED ─────────────────────────────────────────────
const first = await startBooking('Webhook Payer');
if (first.error) {
  console.log(JSON.stringify({ ok: false, reason: first.error }));
  process.exit(1);
}

const received = {
  event: 'PAYMENT RECEIVED',
  data: {
    id: 'ORD123456LCP7890',
    status: 'SUCCESS',
    paymentReference: 'abc123def456',
    paymentPhoneNumber: '255700000012',
    orderReference: first.orderReference,
    collectedAmount: String(first.totalMinor),
    collectedCurrency: first.currency,
    message: 'success',
    channel: 'M-PESA',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
};

const confirmed = await webhook(received);
const replay = await webhook(received);

// ── 1b. The money goes back to the customer after the ticket was issued ───────
// TIPS settles same-day but supports reversals, so this is a real path: the sale must be
// undone, the document voided by a reversal row, and the seat returned to inventory.
const reversedEvent = {
  event: 'PAYMENT RECEIVED',
  data: { ...received.data, status: 'REVERSED', message: 'reversed by provider' },
};
const reversed = await webhook(reversedEvent);
const reversedAgain = await webhook(reversedEvent);

const afterReversal = await json(`/api/seat-map?tripId=${trip.id}`);
const seatAfterReversal = (afterReversal.body?.data?.seats ?? []).find(
  (seat) => seat.label === first.seat,
);

// ── 2. Tampering after signing must be refused ────────────────────────────────
const tamperedPayload = {
  ...received,
  data: { ...received.data, collectedAmount: '1' },
};
const signedOnce = { ...received, checksum: sign(received) };
const tampered = await post('/api/payments/clickpesa', {
  ...tamperedPayload,
  // The checksum from the original payload, now describing different contents.
  checksum: signedOnce.checksum,
});

// ── 3. Unknown reference is not acknowledged ──────────────────────────────────
const unknown = await webhook({
  event: 'PAYMENT RECEIVED',
  data: { ...received.data, orderReference: 'NOSUCHREF01' },
});

// ── 4. PAYMENT FAILED leaves the booking open for a retry ─────────────────────
const second = await startBooking('Failed Payer');

const failedEvent = await webhook({
  event: 'PAYMENT FAILED',
  data: {
    id: 'ORD999LCP0001',
    status: 'FAILED',
    orderReference: second.orderReference,
    message: 'Insufficient balance',
    updatedAt: new Date().toISOString(),
  },
});

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const state = await client.query(
  `select b.id as booking_id, b.status::text as booking_status, p.status::text as payment_status,
          p.failure_code,
          (select count(*)::int from app.ledger_entry where booking_id = b.id) as ledger_rows,
          (select le.status::text from app.ledger_entry le
            where le.booking_id = b.id and le.reverses is not null limit 1) as reversal_status,
          (select count(*)::int from app.booking_passenger
            where booking_id = b.id and status = 'active') as active_passengers
     from app.booking b join app.payment p on p.booking_id = b.id
    where b.id = any($1::uuid[])`,
  [[first.bookingId, second.bookingId]],
);
await client.end();

// Identify the rows by booking id: ordering by PNR is not insertion order.
const firstState = state.rows.find((row) => row.booking_id === first.bookingId);
const secondState = state.rows.find((row) => row.booking_id === second.bookingId);

const ok =
  confirmed.status === 200 &&
  confirmed.body?.paymentStatus === 'paid' &&
  confirmed.body?.bookingStatus === 'issued' &&
  confirmed.body?.replay === false &&
  replay.status === 200 &&
  replay.body?.replay === true &&
  // Reversal undoes the sale: document voided by a new row, seats back on the map.
  reversed.status === 200 &&
  reversed.body?.bookingStatus === 'refunded' &&
  reversed.body?.reversed === true &&
  reversedAgain.body?.reversed === false &&
  seatAfterReversal?.status === 'available' &&
  firstState?.booking_status === 'refunded' &&
  firstState?.payment_status === 'reversed' &&
  firstState?.ledger_rows === 2 &&
  firstState?.reversal_status === 'refunded' &&
  firstState?.active_passengers === 0 &&
  tampered.status === 401 &&
  unknown.status === 404 &&
  failedEvent.status === 200 &&
  failedEvent.body?.recorded === true &&
  secondState?.booking_status === 'pending_payment' &&
  secondState.payment_status === 'failed' &&
  secondState.failure_code === 'Insufficient balance';

console.log(
  JSON.stringify(
    {
      ok,
      orderReference: first.orderReference,
      confirmed: { status: confirmed.status, ...confirmed.body },
      replay: { status: replay.status, replay: replay.body?.replay },
      reversed: { status: reversed.status, ...reversed.body },
      reversedAgain: { status: reversedAgain.status, ...reversedAgain.body },
      seatAfterReversal: { seat: first.seat, status: seatAfterReversal?.status ?? 'missing' },
      tamperedStatus: tampered.status,
      unknownStatus: unknown.status,
      failedEvent: { status: failedEvent.status, ...failedEvent.body },
      paidBooking: firstState,
      failedBooking: secondState,
    },
    null,
    2,
  ),
);
if (!ok) process.exitCode = 1;

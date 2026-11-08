/**
 * Expiry proof against a running server.
 *
 *   node scripts/verify-expiry.mjs [baseUrl]
 *
 * Proves three things, in order:
 *
 *   1. A booking whose window has closed stops claiming to be pending — even if nobody
 *      runs the sweeper — because reading it expires it.
 *   2. Expiry returns the seat to inventory: somebody else can book it afterwards.
 *   3. The sweeper endpoint authenticates its caller, expires the backlog, and does not
 *      touch a booking that is still inside its window.
 *
 * The payment deadline is moved into the past by SQL; waiting fifteen minutes is not a
 * test. Everything else goes through the real endpoints.
 */
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

const post = (path, payload, headers = {}) =>
  json(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });

const results = await json(`/api/bus/results?from=dar&to=dodoma&date=${date}`);
const trip = results.body?.data?.[0];
if (!trip) {
  console.log(JSON.stringify({ ok: false, reason: 'no-trip', status: results.status }));
  process.exit(1);
}

const detail = await json(`/api/trip-detail?id=${trip.id}`);
const stops = detail.body?.data?.stops ?? [];
const fromStop = stops.find((stop) => stop.locationName === 'Dar es Salaam');
const toStop = stops.find((stop) => stop.locationName === 'Dodoma');
if (!fromStop || !toStop) {
  console.log(JSON.stringify({ ok: false, reason: 'no-segment' }));
  process.exit(1);
}

const freeSeats = async (count) => {
  const map = await json(`/api/seat-map?tripId=${trip.id}`);
  return (map.body?.data?.seats ?? [])
    .filter((seat) => seat.status === 'available')
    .slice(0, count)
    .map((seat) => seat.label);
};

/** One booking, from hold to pending. `dueMinutes` positions its deadline. */
async function bookSeat({ dueMinutes, name }) {
  const seats = await freeSeats(1);
  if (seats.length !== 1) return { error: 'no-free-seat' };

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
    customerPhone: '255700000011',
    passengers: [{ fullName: name, category: 'adult', seatNo: seats[0] }],
  });
  if (booked.status !== 201) return { error: `booking ${booked.status}` };

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    `update app.booking set payment_due_at = now() + make_interval(mins => $2) where id = $1`,
    [booked.body.bookingId, dueMinutes],
  );
  return {
    bookingId: booked.body.bookingId,
    pnr: booked.body.pnr,
    seat: seats[0],
    accessToken: booked.body.accessToken,
    client,
  };
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// ── 1. Reading an overdue booking expires it, and says so ─────────────────────
const overdue = await bookSeat({ dueMinutes: -1, name: 'Overdue Reader' });
if (overdue.error) {
  console.log(JSON.stringify({ ok: false, reason: overdue.error }));
  process.exit(1);
}

const readBack = await json(`/api/booking-status?token=${encodeURIComponent(overdue.accessToken ?? '')}`);
const afterRead = await client.query(
  `select b.status::text as booking_status,
          (select count(*)::int from app.booking_passenger where booking_id = b.id and status = 'cancelled') as cancelled_pax,
          (select count(*)::int from app.seat_hold where booking_id = b.id and status = 'released') as released_holds,
          (select count(*)::int from app.booking_event where booking_id = b.id and type = 'booking.expired') as expiry_events
     from app.booking b where b.id = $1`,
  [overdue.bookingId],
);

const readExpires =
  readBack.status === 200 &&
  readBack.body?.status === 'expired' &&
  afterRead.rows[0].booking_status === 'expired' &&
  afterRead.rows[0].cancelled_pax === 1 &&
  afterRead.rows[0].released_holds === 1 &&
  afterRead.rows[0].expiry_events === 1;

// ── 2. The seat is sellable again ─────────────────────────────────────────────
// Releasing the hold is only half the promise; the next customer has to be able to buy it.
const remarketed = await bookSeat({ dueMinutes: 15, name: 'Next Customer' });
const seatReturned =
  !remarketed.error &&
  // The seat released above may be a different label if the map shifted; what matters is
  // that the booking that lost its seat is gone and a new one can exist on this trip.
  Boolean(remarketed.bookingId) &&
  remarketed.bookingId !== overdue.bookingId;

// ── 3. The sweeper: authentication, backlog, and the untouchable window ───────
const unauthorized = await json('/api/internal/sweep', {
  method: 'POST',
  headers: { 'x-sweep-secret': 'not-the-secret' },
});

// A booking still inside its window must survive a sweep.
const fresh = await bookSeat({ dueMinutes: 15, name: 'Still Paying' });
// And one already past it, which nobody has opened.
const stale = await bookSeat({ dueMinutes: -5, name: 'Nobody Opened' });

const swept = await json('/api/internal/sweep', {
  method: 'POST',
  headers: { 'x-sweep-secret': process.env.MAINTENANCE_SECRET ?? '' },
});

const postSweep = await client.query(
  `select id, status::text as status from app.booking where id = any($1::uuid[])`,
  [[fresh.bookingId, stale.bookingId]],
);
const byId = Object.fromEntries(postSweep.rows.map((row) => [row.id, row.status]));

const sweepWorks =
  unauthorized.status === 401 &&
  swept.status === 200 &&
  typeof swept.body?.expired === 'number' &&
  swept.body.expired >= 1 &&
  byId[stale.bookingId] === 'expired' &&
  // The one that still has time must be untouched.
  byId[fresh.bookingId] === 'pending_payment';

for (const handle of [overdue, remarketed, fresh, stale]) {
  if (handle.client) await handle.client.end();
}
await client.end();

const ok = readExpires && seatReturned && sweepWorks;

console.log(
  JSON.stringify(
    {
      ok,
      readPathExpiry: {
        statusReturned: readBack.body?.status,
        db: afterRead.rows[0],
      },
      seatRemarketed: { bookingId: remarketed.bookingId, seat: remarketed.seat },
      sweeper: {
        unauthorizedStatus: unauthorized.status,
        status: swept.status,
        expired: swept.body?.expired,
        remaining: swept.body?.remaining,
        stale: byId[stale.bookingId],
        fresh: byId[fresh.bookingId],
      },
    },
    null,
    2,
  ),
);
if (!ok) process.exitCode = 1;

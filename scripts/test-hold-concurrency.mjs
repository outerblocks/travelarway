/**
 * Concurrency proof for seat holds.
 *
 * Two independent connections race for the same seat on the same trip. Exactly one may
 * win; the other must be rejected by ux_seat_hold_active. Nothing here is mocked: the
 * real indexes decide the outcome.
 *
 *   node scripts/test-hold-concurrency.mjs
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.log(JSON.stringify({ ok: false, reason: 'no-url' }));
  process.exit(1);
}

const url = new URL(raw);
const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
const makeClient = (name) =>
  new pg.Client({
    connectionString: url.toString(),
    ssl: local ? undefined : { rejectUnauthorized: true },
    connectionTimeoutMillis: 8000,
    application_name: `travelar-race-${name}`,
  });

const SEAT = 'Z99';
const a = makeClient('a');
const b = makeClient('b');
await Promise.all([a.connect(), b.connect()]);

const report = { seat: SEAT, tripId: null, first: null, second: null, ok: false };

try {
  const trip = await a.query(
    `select id from app.trip where status = 'scheduled' order by service_date limit 1`,
  );
  if (trip.rowCount === 0) {
    console.log(JSON.stringify({ ok: false, reason: 'no-scheduled-trip-run-seed-first' }));
    process.exit(1);
  }
  const tripId = trip.rows[0].id;
  report.tripId = tripId;

  // Deterministic starting point, so the script can be re-run.
  await a.query(
    `delete from app.seat_hold where trip_id = $1 and seat_no = $2`,
    [tripId, SEAT],
  );

  await a.query('begin');
  await b.query('begin');

  await a.query(
    `insert into app.seat_hold (trip_id, seat_no, expires_at)
     values ($1, $2, now() + interval '10 minutes')`,
    [tripId, SEAT],
  );
  report.first = 'accepted';

  // Start B's insert while A still holds the row uncommitted. B must block, then fail
  // once A commits — that is the mutual exclusion being exercised, not bypassed.
  const secondInsert = b
    .query(
      `insert into app.seat_hold (trip_id, seat_no, expires_at)
       values ($1, $2, now() + interval '10 minutes')`,
      [tripId, SEAT],
    )
    .then(() => ({ accepted: true }))
    .catch((error) => ({ accepted: false, code: error.code }));

  await new Promise((resolve) => setTimeout(resolve, 150));
  await a.query('commit');

  const outcome = await secondInsert;
  report.second = outcome.accepted ? 'accepted' : outcome.code;

  await b.query('rollback').catch(() => {});
  await a.query(`delete from app.seat_hold where trip_id = $1 and seat_no = $2`, [tripId, SEAT]);

  report.ok = report.first === 'accepted' && outcome.accepted === false && outcome.code === '23505';

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  await a.query('rollback').catch(() => {});
  await b.query('rollback').catch(() => {});
  console.log(JSON.stringify({ ...report, ok: false, error: error.message, code: error.code ?? null }, null, 2));
  process.exitCode = 1;
} finally {
  await Promise.all([a.end().catch(() => {}), b.end().catch(() => {})]);
}

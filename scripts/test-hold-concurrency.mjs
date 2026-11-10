/**
 * Concurrency proof for bus seat holds on the same stop interval.
 *
 * Two connections race for the same seat and interval. Exactly one may win; the other
 * must be rejected by seat_hold_no_overlap (23P01). Adjacent intervals are a separate proof
 * in unit tests.
 *
 *   APP_ENV=test DB_TARGET=test node scripts/test-hold-concurrency.mjs
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

if (process.env.APP_ENV !== 'test' || process.env.DB_TARGET !== 'test') {
  console.log(JSON.stringify({ ok: false, reason: 'refused_non_test_database' }));
  process.exit(1);
}

const raw = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!raw) {
  console.log(JSON.stringify({ ok: false, reason: 'no-url' }));
  process.exit(1);
}

const url = new URL(raw);
const local = ['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal'].includes(url.hostname);
if (!local) {
  console.log(JSON.stringify({ ok: false, reason: 'refused_remote_restore_target' }));
  process.exit(1);
}
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

const report = { seat: SEAT, tripId: null, first: null, second: null, ok: false, code: null };

try {
  const trip = await a.query(
    `select t.id, fs.id as from_stop_id, ts.id as to_stop_id, fs.sequence as from_seq, ts.sequence as to_seq
       from app.trip t
       join app.route_stop fs on fs.route_id = t.route_id
       join app.route_stop ts on ts.route_id = t.route_id and ts.sequence > fs.sequence
      where t.status = 'scheduled'
      order by t.service_date, ts.sequence - fs.sequence desc
      limit 1`,
  );
  if (trip.rowCount === 0) {
    console.log(JSON.stringify({ ok: false, reason: 'no-scheduled-trip-run-seed-first' }));
    process.exit(1);
  }
  const { id: tripId, from_stop_id, to_stop_id, from_seq, to_seq } = trip.rows[0];
  report.tripId = tripId;

  await a.query(`delete from app.seat_hold where trip_id = $1 and seat_no = $2`, [tripId, SEAT]);

  const insertSql = `insert into app.seat_hold
    (trip_id, seat_no, expires_at, from_stop_id, to_stop_id, from_seq, to_seq)
    values ($1, $2, now() + interval '10 minutes', $3, $4, $5, $6)`;
  const params = [tripId, SEAT, from_stop_id, to_stop_id, from_seq, to_seq];

  await a.query('begin');
  await b.query('begin');

  await a.query(insertSql, params);
  report.first = 'accepted';

  const secondInsert = b
    .query(insertSql, params)
    .then(() => ({ accepted: true }))
    .catch((error) => ({ accepted: false, code: error.code }));

  await new Promise((resolve) => setTimeout(resolve, 150));
  await a.query('commit');

  const outcome = await secondInsert;
  report.second = outcome.accepted ? 'accepted' : outcome.code;
  report.code = outcome.code ?? null;

  await b.query('rollback').catch(() => {});
  await a.query(`delete from app.seat_hold where trip_id = $1 and seat_no = $2`, [tripId, SEAT]);

  report.ok = report.first === 'accepted' && outcome.accepted === false && outcome.code === '23P01';

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

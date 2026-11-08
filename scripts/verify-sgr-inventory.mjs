/**
 * Verifies the SGR inventory service against the real database.
 *
 *   node scripts/verify-sgr-inventory.mjs
 *
 * These are the cases that cost money if they are wrong: two passengers holding the same
 * seat at the same moment, a seat sold for the first half of a journey being resellable for
 * the second, and a retried request creating a second hold. They run against the committed
 * schema because the exclusion constraint that answers them is a database object, and no
 * amount of mocking a connection proves it works.
 *
 * Everything it creates is deleted at the end, keyed on its service_ref.
 */
import { build } from 'esbuild';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const result = await build({
  entryPoints: [path.join('src', 'server', 'sgr', 'inventory.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  alias: { '@': path.resolve('src') },
  // Dependencies stay outside the bundle: esbuild's ESM output cannot `require` a CommonJS
  // package (or a Node builtin) at runtime, which is what inlining dotenv turned into.
  packages: 'external',
  outfile: path.join('.tanstack', 'sgr-inventory.verify.mjs'),
  logLevel: 'silent',
});
if (result.errors.length) {
  console.log(JSON.stringify({ ok: false, errors: result.errors }, null, 2));
  process.exit(1);
}

// The read models are bundled separately so this file proves them as a caller would use
// them, rather than reaching around the provider to the functions underneath.
await build({
  entryPoints: [path.join('src', 'server', 'sgr', 'read-models.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  alias: { '@': path.resolve('src') },
  packages: 'external',
  outfile: path.join('.tanstack', 'sgr-read-models.verify.mjs'),
  logLevel: 'silent',
});

const inventory = await import(pathToFileURL(path.resolve('.tanstack', 'sgr-inventory.verify.mjs')).href);
const client = new pg.Client({ connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL });
await client.connect();

const SERVICE_REF = `VERIFY-SGR-${Date.now()}`
  .toUpperCase();
const checks = [];
const record = (name, pass, detail = '') => checks.push({ check: name, result: pass ? 'PASS' : 'FAIL', detail });

const stations = await client.query(`select id, name from app.location where name = any($1)`, [
  ['Dar es Salaam', 'Morogoro', 'Dodoma'],
]);
const stationId = (name) => stations.rows.find((row) => row.name === name).id;

try {
  // Three stops: the ranges 0->1 and 1->2 are adjacent, 0->2 spans both.
  const { tripId, seats } = await inventory.materialiseTrip({
    serviceRef: SERVICE_REF,
    trainsetCode: 'TRC_SGR_EMU_8CAR',
    originStationId: stationId('Dar es Salaam'),
    destinationStationId: stationId('Dodoma'),
    stops: [
      { stationId: stationId('Dar es Salaam'), seq: 0 },
      { stationId: stationId('Morogoro'), seq: 1 },
      { stationId: stationId('Dodoma'), seq: 2 },
    ],
    departsAt: new Date(Date.now() + 86_400_000),
    arrivesAt: new Date(Date.now() + 86_400_000 + 7 * 3_600_000),
    // A small allocation keeps the run fast and proves non-allocated seats are excluded.
    allocation: ['2:1', '2:2', '2:3'],
  });

  const counted = await client.query(
    `select count(*)::int as seats, count(*) filter (where sellable)::int as sellable
       from app.sgr_trip_seats where trip_id = $1`,
    [tripId],
  );
  record('materialise: 583 seats copied from the published layout', seats === 583, `got ${seats}`);
  record('materialise: only allocated seats are sellable', counted.rows[0].sellable === 3, `got ${counted.rows[0].sellable}`);

  const seat = { coachNo: 2, seatNumber: 1 };
  const held = await inventory.holdSeats({
    tripId,
    holdKey: `${SERVICE_REF}-A`,
    seats: [seat],
    fromSeq: 0,
    toSeq: 1,
    ttlSeconds: 300,
  });
  record('hold: first claim succeeds', !!held.holdId && held.reused === false);

  const retried = await inventory.holdSeats({
    tripId,
    holdKey: `${SERVICE_REF}-A`,
    seats: [seat],
    fromSeq: 0,
    toSeq: 1,
    ttlSeconds: 300,
  });
  record('hold: same key returns the same hold, no second claim', retried.holdId === held.holdId && retried.reused === true);

  // The seat is taken for 0->1 but the passenger gets off at Morogoro: 1->2 must be sellable.
  const resale = await inventory.holdSeats({
    tripId,
    holdKey: `${SERVICE_REF}-B`,
    seats: [seat],
    fromSeq: 1,
    toSeq: 2,
    ttlSeconds: 300,
  });
  record('segment resale: Morogoro->Dodoma still sellable after Dar->Morogoro', !!resale.holdId);

  let overlapRefused = false;
  try {
    await inventory.holdSeats({
      tripId,
      holdKey: `${SERVICE_REF}-C`,
      seats: [seat],
      fromSeq: 0,
      toSeq: 2,
      ttlSeconds: 300,
    });
  } catch (error) {
    overlapRefused = error.message.startsWith('seats_unavailable') || error.message.startsWith('conflicting');
  }
  record('overlap: a claim spanning an existing one is refused', overlapRefused);

  // Five requests for the same range at the same instant. Exactly one may win, and the
  // others must fail cleanly rather than hang or double-book.
  const race = await Promise.allSettled(
    Array.from({ length: 5 }, (_, index) =>
      inventory.holdSeats({
        tripId,
        holdKey: `${SERVICE_REF}-RACE-${index}`,
        seats: [{ coachNo: 2, seatNumber: 2 }],
        fromSeq: 0,
        toSeq: 2,
        ttlSeconds: 300,
      }),
    ),
  );
  const wins = race.filter((entry) => entry.status === 'fulfilled').length;
  const cleanFailures = race.filter((entry) => entry.status === 'rejected').every((entry) =>
    ['seats_unavailable', 'conflicting key value', 'could not serialize'].some((needle) =>
      String(entry.reason?.message ?? '').includes(needle),
    ),
  );
  record('concurrency: exactly one of five parallel holds wins', wins === 1, `${wins} succeeded`);
  record('concurrency: the losers fail with a clear reason', cleanFailures);

  // A partial request must not leave half a booking behind.
  let partialRolledBack = false;
  try {
    await inventory.holdSeats({
      tripId,
      holdKey: `${SERVICE_REF}-PARTIAL`,
      seats: [{ coachNo: 2, seatNumber: 3 }, { coachNo: 2, seatNumber: 2 }],
      fromSeq: 0,
      toSeq: 2,
      ttlSeconds: 300,
    });
  } catch {
    const orphan = await client.query(
      `select count(*)::int as n from app.sgr_holds h
        join app.sgr_seat_segments g on g.hold_id = h.id
       where h.hold_key = $1`,
      [`${SERVICE_REF}-PARTIAL`],
    );
    partialRolledBack = orphan.rows[0].n === 0;
  }
  record('all-or-nothing: a failed multi-seat hold leaves no partial claim', partialRolledBack);

  const released = await inventory.releaseHold(held.holdId);
  const afterRelease = await inventory.holdSeats({
    tripId,
    holdKey: `${SERVICE_REF}-D`,
    seats: [seat],
    fromSeq: 0,
    toSeq: 1,
    ttlSeconds: 300,
  });
  record('release: the seat becomes claimable again', released.released === 1 && !!afterRelease.holdId);

  // An expired hold must not keep a seat blocked.
  await client.query(`update app.sgr_holds set expires_at = now() - interval '1 second' where hold_key = $1`, [
    `${SERVICE_REF}-RACE-0`,
  ]);
  const swept = await inventory.releaseExpiredHolds();
  const afterSweep = await inventory.holdSeats({
    tripId,
    holdKey: `${SERVICE_REF}-E`,
    seats: [{ coachNo: 2, seatNumber: 2 }],
    fromSeq: 0,
    toSeq: 2,
    ttlSeconds: 300,
  });
  record('sweeper: an expired hold frees its seat', swept.expired >= 1 && !!afterSweep.holdId);

  const nonSellable = await inventory
    .holdSeats({
      tripId,
      holdKey: `${SERVICE_REF}-F`,
      seats: [{ coachNo: 5, seatNumber: 1 }],
      fromSeq: 0,
      toSeq: 1,
      ttlSeconds: 300,
    })
    .then(() => 'ACCEPTED')
    .catch((error) => error.message);
  record('allocation: a seat Travelar was not given cannot be held', nonSellable === 'seats_unavailable', String(nonSellable));

  // ── Read models, over a full unallocated EMU ─────────────────────────────────
  const full = await inventory.materialiseTrip({
    serviceRef: `${SERVICE_REF}-FULL`,
    trainsetCode: 'TRC_SGR_EMU_8CAR',
    originStationId: stationId('Dar es Salaam'),
    destinationStationId: stationId('Dodoma'),
    stops: [
      { stationId: stationId('Dar es Salaam'), seq: 0 },
      { stationId: stationId('Morogoro'), seq: 1 },
      { stationId: stationId('Dodoma'), seq: 2 },
    ],
    departsAt: new Date(Date.now() + 86_400_000),
    arrivesAt: new Date(Date.now() + 86_400_000 + 7 * 3_600_000),
  });
  const readModels = await import(pathToFileURL(path.resolve('.tanstack', 'sgr-read-models.verify.mjs')).href);

  const availability = await readModels.getClassAvailability({ tripId: full.tripId, fromSeq: 0, toSeq: 2 });
  const byClass = Object.fromEntries(availability.map((entry) => [entry.seatClassCode, entry]));
  record('class availability: ROYAL 39', byClass.ROYAL?.available === 39, JSON.stringify(byClass.ROYAL));
  record('class availability: BUSINESS 544', byClass.BUSINESS?.available === 544, JSON.stringify(byClass.BUSINESS));
  // The EMU carries no Economy coach. The spec is explicit that this must be reported as
  // zero-and-sold-out rather than left out, because an absent class and a full one need
  // different answers from the passenger.
  record('class availability: ECONOMY reported as 0 and soldOut', byClass.ECONOMY?.available === 0 && byClass.ECONOMY?.soldOut === true, JSON.stringify(byClass.ECONOMY));

  const business = await readModels.getCarSeatState({ tripId: full.tripId, seatClassCode: 'BUSINESS', fromSeq: 0, toSeq: 2 });
  const coachNumbers = business.cars.map((car) => car.coachNo);
  record('car navigation: BUSINESS cars are 2..8 in order', JSON.stringify(coachNumbers) === JSON.stringify([2, 3, 4, 5, 6, 7, 8]), JSON.stringify(coachNumbers));
  record('car navigation: chain wired both ways', business.cars[1].prevCoachNo === 2 && business.cars[1].nextCoachNo === 4 && business.cars[0].prevCoachNo === null && business.cars.at(-1).nextCoachNo === null);
  record('car navigation: default coach is the first with space', business.defaultCoachNo === 2);

  const royal = await readModels.getCarSeatState({ tripId: full.tripId, seatClassCode: 'ROYAL', fromSeq: 0, toSeq: 2 });
  record('car navigation: ROYAL has only coach 1', royal.cars.length === 1 && royal.cars[0].coachNo === 1 && royal.cars[0].capacity === 39, JSON.stringify(royal.cars.map((car) => car.capacity)));

  // Fill coach 2 completely, then the default must move on by itself.
  const coach2 = business.cars[0];
  await inventory.holdSeats({
    tripId: full.tripId,
    holdKey: `${SERVICE_REF}-FILL2`,
    seats: coach2.seats.map((seat) => ({ coachNo: 2, seatNumber: seat.seatNumber })),
    fromSeq: 0,
    toSeq: 2,
    ttlSeconds: 300,
  });
  const afterFill = await readModels.getCarSeatState({ tripId: full.tripId, seatClassCode: 'BUSINESS', fromSeq: 0, toSeq: 2 });
  record('default coach moves when a coach fills', afterFill.cars[0].full === true && afterFill.defaultCoachNo === 3, `default=${afterFill.defaultCoachNo}`);

  const counts = await readModels.getClassAvailability({ tripId: full.tripId, fromSeq: 0, toSeq: 2 });
  const businessAfter = counts.find((entry) => entry.seatClassCode === 'BUSINESS');
  record('class count drops by the coach that filled', businessAfter.available === 544 - 90, `got ${businessAfter.available}`);

  // A seat held for the first half only must read as free for the second half.
  const halfRange = await readModels.getCarSeatState({ tripId: full.tripId, seatClassCode: 'ROYAL', fromSeq: 1, toSeq: 2 });
  record('range-aware: coach 1 still free for the second half', halfRange.cars[0].availableCount === 39, `got ${halfRange.cars[0].availableCount}`);
} catch (error) {
  record('run completed without an unexpected error', false, String(error?.message ?? error));
} finally {
  await client.query(`delete from app.sgr_trips where service_ref = $1 or service_ref = $2`, [SERVICE_REF, `${SERVICE_REF}-FULL`]);
  await client.end();
  await import('node:fs').then((fs) => {
    fs.rmSync(path.join('.tanstack', 'sgr-inventory.verify.mjs'), { force: true });
    fs.rmSync(path.join('.tanstack', 'sgr-read-models.verify.mjs'), { force: true });
  });
}

console.table(checks);
const failed = checks.filter((check) => check.result === 'FAIL').length;
console.log(JSON.stringify({ ok: failed === 0, passed: checks.length - failed, failed }));
process.exitCode = failed === 0 ? 0 : 1;

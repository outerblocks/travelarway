/**
 * Seeds the SGR timetable and provisional fares.
 *
 *   node scripts/seed-sgr-timetable.mjs [--days=7] [--from=2026-11-01]
 *
 * Idempotent and safe to run daily. A trip that already exists is **left alone** — never
 * updated — because overwriting one would delete the holds and tickets sitting inside it.
 * Seats and segments are only generated for trips that have none.
 *
 * The coach geometry is read out of `sgr_coach_layouts` rather than imported from the
 * TypeScript generators, so a layout an operator publishes in the database shows up on
 * trips without a code change.
 *
 * Seats are inserted in bulk (jsonb expansion in one statement) instead of one round trip
 * per seat. A week of this timetable is roughly 60,000 seats; the row-by-row path in
 * `materialiseTrip` takes minutes at that volume, and a seed that has to be re-run every
 * day has to be quick enough that nobody is tempted to skip it.
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? 'true'];
  }),
);

const DAYS = Math.max(1, Math.min(60, Number(args.days ?? 7) || 7));
const AFRICA_DAR_UTC_OFFSET_HOURS = 3; // No daylight saving on this corridor.

function instant(date, time) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) - AFRICA_DAR_UTC_OFFSET_HOURS * 3_600_000,
  );
}

function addDays(iso, count) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/**
 * The operator's published services, transcribed from the capture in `src/data/sgr.ts`.
 * `trainset` is which physical set runs the pattern; `pattern` is what TRC calls the
 * service, and it is the pattern that decides the fare.
 */
const SERVICES = [
  { number: '0011904', pattern: 'EXPRESS', trainset: 'TRC_SGR_EXPRESS', direction: 'outbound', departure: '06:00', arrival: '09:50' },
  { number: '011906', pattern: 'ROYAL_EXPRESS', trainset: 'TRC_SGR_EMU_8CAR', direction: 'outbound', departure: '07:20', arrival: '10:37' },
  { number: '011908', pattern: 'ORDINARY_LINE', trainset: 'TRC_SGR_EXPRESS', direction: 'outbound', departure: '09:40', arrival: '13:37' },
  { number: '011910', pattern: 'ROYAL_EXPRESS', trainset: 'TRC_SGR_EMU_8CAR', direction: 'outbound', departure: '13:10', arrival: '16:36' },
  { number: '011912', pattern: 'ORDINARY_LINE', trainset: 'TRC_SGR_EXPRESS', direction: 'outbound', departure: '18:55', arrival: '23:01' },
  { number: '0020102', pattern: 'EXPRESS', trainset: 'TRC_SGR_EXPRESS', direction: 'return', departure: '05:15', arrival: '09:09' },
  { number: '00020103', pattern: 'ROYAL_EXPRESS', trainset: 'TRC_SGR_EMU_8CAR', direction: 'return', departure: '07:35', arrival: '11:04' },
  { number: '020106', pattern: 'ORDINARY_LINE', trainset: 'TRC_SGR_EXPRESS', direction: 'return', departure: '14:15', arrival: '18:17' },
  { number: '020108', pattern: 'ORDINARY_LINE', trainset: 'TRC_SGR_EXPRESS', direction: 'return', departure: '17:15', arrival: '21:10' },
  { number: '0020109', pattern: 'ROYAL_EXPRESS', trainset: 'TRC_SGR_EMU_8CAR', direction: 'return', departure: '18:40', arrival: '21:57' },
];

/**
 * Journey fares in TZS per adult, from the operator capture.
 *
 * The Economy figure is the published journey fare for the pattern; Business and Royal are
 * the published Economy fare plus the class differential measured on the 06:00 Express
 * (30,000 and 40,000). They are seeded as PROVISIONAL with no approval reference because
 * that is what they are: real numbers read off the operator's own prices, not a fare table
 * LATRA has issued to us. When TRC's feed arrives these rows are replaced, not trusted.
 *
 * No child fare is seeded. The capture has none, and inventing a discount would set a price
 * the operator may not honour — a child in the party is refused at quote time instead.
 */
const FARES = [
  { pattern: 'EXPRESS', seatClass: 'ECONOMY', amount: 50_500 },
  { pattern: 'EXPRESS', seatClass: 'BUSINESS', amount: 80_500 },
  { pattern: 'EXPRESS', seatClass: 'ROYAL', amount: 90_500 },
  { pattern: 'ORDINARY_LINE', seatClass: 'ECONOMY', amount: 31_500 },
  { pattern: 'ORDINARY_LINE', seatClass: 'BUSINESS', amount: 61_500 },
  { pattern: 'ORDINARY_LINE', seatClass: 'ROYAL', amount: 71_500 },
  { pattern: 'ROYAL_EXPRESS', seatClass: 'BUSINESS', amount: 80_500 },
  { pattern: 'ROYAL_EXPRESS', seatClass: 'ROYAL', amount: 90_500 },
];

const PROVISIONAL_NOTE =
  'Provisional: transcribed from the operator capture in src/data/sgr.ts (published journey fare plus measured class differential). Not a LATRA-issued fare table.';

const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
});
await client.connect();

const report = { stations: 0, faresUpserted: 0, tripsCreated: 0, tripsSkipped: 0, seats: 0, segments: 0 };

try {
  await client.query('begin');

  // The twelve SGR stations, in the order the line runs. They exist as `app.location` rows of
  // kind 'station' since the geography seed. A train service belongs to the station rather
  // than to the city, and the fare is keyed the same way so the two cannot drift apart.
  const stationNames = [
    'Dar es Salaam SGR Station',
    'Pugu SGR Station',
    'Soga SGR Station',
    'Ruvu SGR Station',
    'Ngerengere SGR Station',
    'Morogoro SGR Station',
    'Mkata SGR Station',
    'Kilosa SGR Station',
    'Kidete SGR Station',
    'Gulwe SGR Station',
    'Igandu SGR Station',
    'Dodoma SGR Station',
  ];
  const stations = await client.query(
    `select id, name from app.location where name = any($1) and kind = 'station'`,
    [stationNames],
  );
  if (stations.rowCount !== stationNames.length) {
    const found = new Set(stations.rows.map((row) => row.name));
    throw new Error(
      `station_lookup_incomplete: ${stationNames.filter((name) => !found.has(name)).join(', ')} missing from app.location — run scripts/seed-geography.mjs first`,
    );
  }
  const stationId = (name) => stations.rows.find((row) => row.name === name).id;
  const outboundStops = stationNames.map(stationId);
  const returnStops = [...outboundStops].reverse();
  const [darStation, dodomaStation] = [stationId(stationNames[0]), stationId(stationNames.at(-1))];
  report.stations = stations.rowCount;

  // ── Optional reset ────────────────────────────────────────────────────────────
  // The corridor used to be seeded with three stops keyed to city rows. Replacing those
  // trips is a delete, not an update, and it is opt-in: a trip carrying a sold segment is
  // never removed, because that would take a ticket a passenger holds with it.
  if (args.reset) {
    const sold = await client.query(
      `select count(*)::int as n from app.sgr_trips t
        where t.service_ref like 'SGR-%'
          and exists (select 1 from app.sgr_seat_segments g
                       join app.sgr_trip_seats s on s.id = g.trip_seat_id
                      where s.trip_id = t.id and g.state = 'SOLD')`,
    );
    if (sold.rows[0].n > 0) {
      throw new Error(`reset_refused: ${sold.rows[0].n} seeded trip(s) have sold segments and were not touched`);
    }
    const removed = await client.query(`delete from app.sgr_trips where service_ref like 'SGR-%'`);
    report.tripsReset = removed.rowCount ?? 0;
  }

  // ── Fares ─────────────────────────────────────────────────────────────────────
  // Provisional rows keyed on the *city* rows predate the station rows. Leaving them behind
  // would mean two live fares for what a traveller thinks of as one journey, and the quote
  // would then depend on which one the query happened to read first.
  await client.query(
    `delete from app.sgr_fares
      where fare_source = 'PROVISIONAL'
        and (origin_station_id in (select id from app.location where kind = 'city')
          or destination_station_id in (select id from app.location where kind = 'city'))`,
  );

  for (const direction of [[stationNames[0], stationNames.at(-1)], [stationNames.at(-1), stationNames[0]]]) {
    const [originName, destinationName] = direction;
    for (const fare of FARES) {
      const upsert = await client.query(
        `insert into app.sgr_fares
           (origin_station_id, destination_station_id, seat_class_id, passenger_type,
            amount, currency, service_pattern, fare_source, approval_ref, notes)
         select $1, $2, sc.id, 'adult', $3, 'TZS', $4, 'PROVISIONAL', null, $5
           from app.sgr_seat_classes sc
          where sc.code = $6
         on conflict (
            origin_station_id, destination_station_id, seat_class_id, passenger_type,
            coalesce(service_pattern, ''), coalesce(valid_to, 'infinity'::timestamptz)
          ) do update
            set amount = excluded.amount,
                currency = excluded.currency,
                notes = excluded.notes,
                -- Provenance is never upgraded by a seed. If an operator has approved a price
                -- or TRC has pushed one, this run must not overwrite that with provisional.
                fare_source = case
                  when app.sgr_fares.fare_source = 'PROVISIONAL' then 'PROVISIONAL'
                  else app.sgr_fares.fare_source
                end
          returning id`,
        [stationId(originName), stationId(destinationName), fare.amount, fare.pattern, PROVISIONAL_NOTE, fare.seatClass],
      );
      report.faresUpserted += upsert.rowCount ?? 0;
    }
  }

  // ── Trips ─────────────────────────────────────────────────────────────────────
  const start = args.from ?? new Date().toISOString().slice(0, 10);
  const refs = [];

  for (let offset = 0; offset < DAYS; offset += 1) {
    const date = addDays(start, offset);
    for (const service of SERVICES) {
      const outbound = service.direction === 'outbound';
      const origin = outbound ? darStation : dodomaStation;
      const destination = outbound ? dodomaStation : darStation;
      const stops = outbound ? outboundStops : returnStops;
      const serviceRef = `SGR-${service.number}-${date}`;

      const inserted = await client.query(
        `with trainset as (
           select id from app.sgr_trainset_types where code = $4
         ),
         snapshot as (
           select jsonb_agg(jsonb_build_object(
             'coachNo', l.coach_no,
             'classCode', sc.code,
             'layoutKind', l.layout_kind,
             'gridRows', l.grid_rows,
             'gridCols', l.grid_cols,
             'aisleAfterRow', l.aisle_after_row,
             'seats', coalesce(seat_agg.rows, '[]'::jsonb),
             'fixtures', coalesce(cell_agg.rows, '[]'::jsonb)
           ) order by l.coach_no) as layout
           from app.sgr_coach_layouts l
           join app.sgr_seat_classes sc on sc.id = l.seat_class_id
           cross join trainset t
           left join lateral (
             select jsonb_agg(jsonb_build_object(
               'seatNumber', s.seat_number,
               'seatLabel', s.seat_label,
               'row', s.cell_row_idx,
               'col', s.cell_col_idx,
               'position', s.position,
               'seatKind', s.seat_kind,
               'attributes', s.attributes
             ) order by s.cell_row_idx, s.cell_col_idx) as rows
               from app.sgr_layout_seats s
              where s.coach_layout_id = l.id
           ) seat_agg on true
           left join lateral (
             select jsonb_agg(jsonb_build_object(
               'cellType', c.cell_type, 'row', c.row_idx, 'col', c.col_idx
             ) order by c.row_idx, c.col_idx) as rows
               from app.sgr_layout_cells c
              where c.coach_layout_id = l.id and c.cell_type <> 'SEAT'
           ) cell_agg on true
           where l.trainset_type_id = t.id and l.status = 'PUBLISHED'
         )
         insert into app.sgr_trips
           (service_ref, trainset_type_id, origin_station_id, destination_station_id,
            departs_at, arrives_at, layout_snapshot, status, service_pattern)
         select $1, t.id, $2, $3, $5, $6, s.layout, 'ON_SALE', $7
           from trainset t, snapshot s
          where s.layout is not null
         on conflict (service_ref) do nothing
         returning id`,
        [serviceRef, origin, destination, service.trainset, instant(date, service.departure), instant(date, service.arrival), service.pattern],
      );

      if (!inserted.rowCount) {
        report.tripsSkipped += 1;
        continue;
      }
      report.tripsCreated += 1;
      refs.push(inserted.rows[0].id);

      for (const [seq, station] of stops.entries()) {
        await client.query(
          `insert into app.sgr_trip_stops (trip_id, station_id, seq)
           values ($1, $2, $3)
           on conflict (trip_id, seq) do nothing`,
          [inserted.rows[0].id, station, seq],
        );
      }
    }
  }

  if (refs.length) {
    // ── Seats, from each trip's own snapshot ────────────────────────────────────
    const seats = await client.query(
      `insert into app.sgr_trip_seats
         (trip_id, coach_no, seat_number, seat_class_id, seat_label, position, seat_kind, sellable)
       select t.id,
              (coach ->> 'coachNo')::int,
              (seat ->> 'seatNumber')::int,
              sc.id,
              seat ->> 'seatLabel',
              seat ->> 'position',
              coalesce(seat ->> 'seatKind', 'STANDARD'),
              true
         from app.sgr_trips t
         cross join lateral jsonb_array_elements(t.layout_snapshot) coach
         cross join lateral jsonb_array_elements(coach -> 'seats') seat
         join app.sgr_seat_classes sc on sc.code = coach ->> 'classCode'
        where t.id = any($1::uuid[])
          and not exists (select 1 from app.sgr_trip_seats existing where existing.trip_id = t.id)`,
      [refs],
    );
    report.seats = seats.rowCount ?? 0;

    // One wide AVAILABLE row per seat: claims split it later, so a trip does not need a row
    // for every stop pair before anyone has booked anything.
    const segments = await client.query(
      `insert into app.sgr_seat_segments (trip_seat_id, from_seq, to_seq, state)
       select s.id, 0, coalesce((select max(st.seq) from app.sgr_trip_stops st where st.trip_id = s.trip_id), 1), 'AVAILABLE'
         from app.sgr_trip_seats s
        where s.trip_id = any($1::uuid[])
          and s.sellable
          and not exists (select 1 from app.sgr_seat_segments g where g.trip_seat_id = s.id)`,
      [refs],
    );
    report.segments = segments.rowCount ?? 0;
  }

  await client.query('commit');
} catch (error) {
  await client.query('rollback');
  console.log(JSON.stringify({ ok: false, error: String(error?.message ?? error), report }, null, 2));
  await client.end();
  process.exitCode = 1;
  throw error;
}

await client.end();
console.log(JSON.stringify({ ok: true, days: DAYS, ...report }, null, 2));

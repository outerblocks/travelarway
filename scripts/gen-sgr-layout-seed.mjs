/**
 * Generates db/seed/0004_sgr_layouts.sql from src/server/sgr/layouts.ts.
 *
 * The generator module is the only place the shape of a coach is written down. This script
 * loads it (through esbuild, because the database cannot import TypeScript), asserts every
 * invariant it checks, and emits SQL. So the seed and the unit tests cannot disagree, and a
 * corrected coach interior changes the seed the moment the generator changes.
 *
 *   node scripts/gen-sgr-layout-seed.mjs
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MODULE_FILE = path.join('src', 'server', 'sgr', 'layouts.ts');
const OUTPUT_FILE = path.join('db', 'seed', '0004_sgr_layouts.sql');
const BUNDLE_FILE = path.join('.tanstack', 'sgr-layouts.generated.mjs');

const result = await build({
  entryPoints: [MODULE_FILE],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile: BUNDLE_FILE,
  logLevel: 'silent',
});
if (result.errors.length > 0) {
  console.log(JSON.stringify({ ok: false, errors: result.errors }, null, 2));
  process.exit(1);
}

const layouts = await import(pathToFileURL(BUNDLE_FILE).href);

const TRAINSETS = [
  { index: 0, ...layouts.buildEmuTrainset() },
  { index: 1, ...layouts.buildExpressTrainset() },
];

/** Classes, and the rank a manifest sorts by. Baggage allowance is deliberately not set. */
const CLASSES = [
  { code: 'ECONOMY', name: 'Economy', rank: 1 },
  { code: 'BUSINESS', name: 'Business', rank: 2 },
  { code: 'ROYAL', name: 'Royal Class', rank: 3 },
];

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
const rows = (list) => list.map((row) => `  (${row.join(', ')})`).join(',\n');

const trainsetId = (index) => `f7000000-0000-4000-8000-00000000000${index + 1}`;
const classId = (rank) => `f7100000-0000-4000-8000-00000000000${rank}`;
const coachId = (index, coachNo) => {
  const coach = String(coachNo).padStart(2, '0');
  // 8-4-4-4-12. The coach number appears twice so the id stays unique per trainset and car
  // without needing a hash of anything.
  return `f7${index}${coach}000-0000-4000-8000-0000000000${coach}`;
};

const lines = [
  '-- SGR coach layouts: trainsets, classes, coaches, cells and seats.',
  '--',
  `-- Generated from ${MODULE_FILE} by scripts/gen-sgr-layout-seed.mjs. Do not edit by hand.`,
  '-- Re-run the generator after any change to the layout module; the assertions in that',
  '-- module run first, so a broken coach cannot reach this file.',
  '--',
  '-- Seat counts are the operator\'s published figures: EMU 39/90/74/56/90/74/90/70 = 583,',
  '-- Express 44/45/48 + 76 + 78x10 = 993. EMU maps 583 against roughly 589 quoted by TRC;',
  '-- the six-seat difference is unexplained and is not invented here.',
  '--',
  '-- Baggage allowances are left NULL: the operator has not confirmed them per class, and a',
  '-- guessed allowance would be printed on a ticket and argued at the platform.',
  '',
  '-- ── Trainsets ────────────────────────────────────────────────────────────────────',
  'insert into app.sgr_trainset_types (id, code, name, total_coaches) values',
  rows(TRAINSETS.map((set) => [quote(trainsetId(set.index)), quote(set.code), quote(set.name), set.coaches.length])),
  'on conflict (code) do update set name = excluded.name, total_coaches = excluded.total_coaches;',
  '',
  '-- ── Classes ──────────────────────────────────────────────────────────────────────',
  'insert into app.sgr_seat_classes (id, code, name, rank, free_baggage_kg) values',
  rows(CLASSES.map((cls) => [quote(classId(cls.rank)), quote(cls.code), quote(cls.name), cls.rank, 'null'])),
  'on conflict (code) do update set name = excluded.name, rank = excluded.rank;',
  '',
];

for (const set of TRAINSETS) {
  for (const coach of set.coaches) {
    const id = coachId(set.index, coach.coachNo);
    const classRank = CLASSES.find((entry) => entry.code === coach.classCode).rank;

    // Every grid position the generator names becomes a cell; a seat then points at its own
    // cell, which the foreign key makes impossible to get wrong.
    const cells = [
      ...coach.seats.map((seat) => [quote(id), quote('SEAT'), seat.row, seat.col]),
      ...coach.fixtures.map((fixture) => [quote(id), quote(fixture.cellType), fixture.row, fixture.col]),
    ];

    lines.push(
      `-- ${set.code} coach ${coach.coachNo}: ${coach.classCode}, ${coach.layoutKind}, ${coach.seatCount} seats`,
      `delete from app.sgr_layout_seats where coach_layout_id = ${quote(id)};`,
      `delete from app.sgr_layout_cells where coach_layout_id = ${quote(id)};`,
      `delete from app.sgr_coach_layouts where id = ${quote(id)};`,
      '',
      'insert into app.sgr_coach_layouts (id, trainset_type_id, coach_no, seat_class_id, layout_kind, grid_rows, grid_cols, aisle_after_row, seat_count, version, status, source) values',
      rows([
        [
          quote(id),
          quote(trainsetId(set.index)),
          coach.coachNo,
          quote(classId(classRank)),
          quote(coach.layoutKind),
          coach.gridRows,
          coach.gridCols,
          coach.aisleAfterRow,
          coach.seatCount,
          1,
          quote('PUBLISHED'),
          quote('TRC seat-selection screens, 2026-11-01'),
        ],
      ]),
      ';',
      '',
      'insert into app.sgr_layout_cells (id, coach_layout_id, cell_type, row_idx, col_idx) values',
      rows(cells.map((cell, index) => [`gen_random_uuid()`, ...cell.map(String)])),
      ';',
      '',
      'insert into app.sgr_layout_seats (id, coach_layout_id, cell_row_idx, cell_col_idx, seat_number, seat_label, position, seat_kind, attributes) values',
      rows(
        coach.seats.map((seat) => [
          'gen_random_uuid()',
          quote(id),
          seat.row,
          seat.col,
          seat.seatNumber,
          quote(seat.seatLabel),
          quote(seat.position),
          quote('STANDARD'),
          quote(JSON.stringify(seat.attributes ?? {})),
        ]),
      ),
      ';',
      '',
    );
  }
}

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, `${lines.join('\n')}\n`, 'utf8');
fs.rmSync(BUNDLE_FILE, { force: true });

// The old seed wrote layouts into the generic bus tables using a transposed grid. Those rows
// are superseded: the SGR now has its own tables, and leaving both would mean two answers to
// "how many seats does coach 3 have".
const superseded = path.join('db', 'seed', '0004_sgr_seat_maps.sql');
if (fs.existsSync(superseded)) fs.rmSync(superseded);

const summary = TRAINSETS.map((set) => ({
  trainset: set.code,
  coaches: set.coaches.length,
  seats: set.coaches.reduce((sum, coach) => sum + coach.seatCount, 0),
}));
console.log(JSON.stringify({ ok: true, file: OUTPUT_FILE, summary }, null, 2));

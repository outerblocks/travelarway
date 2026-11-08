/**
 * Seeds the Tanzania Mainland locations offered in the bus From/To selectors.
 *
 *   node scripts/seed-bus-search-locations.mjs
 *
 * The dataset lives in `db/datasets/tanzania-bus-search-locations.json` so that the seed and
 * the tests read the same records. Duplicating it in both places would mean a test that
 * passes against a copy while the import runs on something else.
 *
 * These are **search options, not a route database**. Selecting Arusha → Singida proves both
 * places exist; it does not prove an operator runs that journey, and no route, schedule, fare
 * or corridor is created here. A search that finds no trips has to return none.
 *
 * Idempotent: matched on the source's own slug. A row that already exists under a name (the
 * LATRA towns, adopted before slugs existed) is updated rather than duplicated — two "Tabora"
 * rows would offer the town twice and split any future route data across them.
 *
 * It refuses to commit rather than settling for a different count, because the expected number
 * is in the dataset itself and a silent shortfall would only surface when a traveller typed the
 * missing name.
 */
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const DATASET_FILE = 'db/datasets/tanzania-bus-search-locations.json';

/** Zanzibar is a ferry market, not a bus one. A name from there must never enter this set. */
const ZANZIBAR_NAMES = new Set([
  'zanzibar', 'unguja', 'pemba', 'kjachazi', 'wete', 'mkanyakoni', 'chake chake',
  'kaskazini pemba', 'kaskazini unguja', 'kusini pemba', 'kusini unguja',
  'mjini magharibi', 'mkoani',
]);

function slugFromName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const dataset = JSON.parse(readFileSync(DATASET_FILE, 'utf8'));
const locations = dataset.locations.map((entry) => ({ ...entry, country_code: entry.country_code ?? dataset.country }));

// ── Validate before touching the database ───────────────────────────────────────
const problems = [];
const seenCodes = new Set();
const seenNames = new Set();

for (const location of locations) {
  if (seenCodes.has(location.code)) problems.push(`duplicate code: ${location.code}`);
  seenCodes.add(location.code);

  const normalisedName = location.name.trim().toLowerCase();
  if (seenNames.has(normalisedName)) problems.push(`duplicate name: ${location.name}`);
  seenNames.add(normalisedName);

  if (location.country_code !== 'TZ') problems.push(`unexpected country: ${location.name} → ${location.country_code}`);
  if (ZANZIBAR_NAMES.has(normalisedName)) problems.push(`Zanzibar location in a Mainland dataset: ${location.name}`);
  // Not fatal on its own, but a mismatch nearly always means one of the two was typed wrong,
  // and discovering that later means a slug that no import will ever match.
  if (slugFromName(location.name) !== location.code) {
    problems.push(`code does not match its name: ${location.code} vs ${slugFromName(location.name)}`);
  }
}

if (locations.length !== dataset.expectedCount) {
  problems.push(`dataset declares ${dataset.expectedCount} locations, contains ${locations.length}`);
}

if (problems.length) {
  console.log(JSON.stringify({ ok: false, stage: 'validation', problems }, null, 2));
  process.exitCode = 1;
  throw new Error(`seed validation failed: ${problems.length} problem(s)`);
}

// ── Import ──────────────────────────────────────────────────────────────────────
const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
});
await client.connect();

const report = { adopted: 0, created: 0, hidden: [], hiddenCount: 0 };

try {
  await client.query('begin');

  for (const location of locations) {
    // By slug first (a re-run), then by name (adopting a row the LATRA seed created before
    // slugs existed). Restricted to settlements on purpose: Tanga exists as a ferry port, and
    // matching by name alone would have converted that port row into a bus endpoint and taken
    // it out of the ferry picker.
    const existing = await client.query(
      `select id, kind from app.location
        where country_code = $1
          and kind in ('city', 'town')
          and (slug = $2 or lower(name) = lower($3))
        order by (slug = $2) desc
        limit 1`,
      [location.country_code, location.code, location.name],
    );

    if (existing.rowCount) {
      await client.query(
        `update app.location
            set name = $2, slug = $3, is_searchable = true, is_active = true, updated_at = now()
          where id = $1`,
        [existing.rows[0].id, location.name, location.code],
      );
      report.adopted += 1;
      continue;
    }

    await client.query(
      `insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
       values ($1, upper(replace($3, '-', '')), $2, 'town', $3, true, true, 'reference', $4)`,
      [
        location.name,
        location.country_code,
        location.code,
        'Bus search endpoint. Selectable in From/To; does not imply a scheduled service.',
      ],
    );
    report.created += 1;
  }

  // Anything else that is a settlement but not in the dataset leaves the picker. Reported
  // rather than left to be discovered as "why can't I search Lindi?".
  const excluded = await client.query(
    `update app.location
        set is_searchable = false, updated_at = now()
      where kind in ('city', 'town')
        and slug is null
      returning name`,
  );
  report.hidden = excluded.rows.map((row) => row.name).sort();
  report.hiddenCount = excluded.rowCount ?? 0;

  const check = await client.query(
    `select count(*)::int as n from app.location
      where is_searchable and is_active and country_code = 'TZ' and kind in ('city', 'town')`,
  );
  if (check.rows[0].n !== dataset.expectedCount) {
    throw new Error(`post-import count is ${check.rows[0].n}, expected ${dataset.expectedCount}`);
  }

  await client.query('commit');
} catch (error) {
  await client.query('rollback');
  console.log(JSON.stringify({ ok: false, error: String(error?.message ?? error), report }, null, 2));
  await client.end();
  process.exitCode = 1;
  throw error;
}

const listing = await client.query(
  `select name from app.location
    where is_searchable and is_active and country_code = 'TZ' and kind in ('city', 'town')
    order by name
    limit 5`,
);
await client.end();

console.log(JSON.stringify(
  {
    ok: true,
    ...report,
    searchable_total: dataset.expectedCount,
    first_five_alphabetical: listing.rows.map((row) => row.name),
  },
  null,
  2,
));

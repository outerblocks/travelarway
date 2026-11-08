/**
 * Upserts worldwide IATA airports into app.location from db/datasets/iata-airports.json.
 *
 *   node scripts/seed-iata-airports.mjs
 *
 * Geography only. Selecting two airports does not invent a flight.
 */
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const dataset = JSON.parse(readFileSync('db/datasets/iata-airports.json', 'utf8'));
const locations = dataset.locations ?? [];

if (locations.length !== dataset.expectedCount) {
  console.log(JSON.stringify({
    ok: false,
    reason: 'count-mismatch',
    expected: dataset.expectedCount,
    actual: locations.length,
  }));
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
});
await client.connect();

try {
  await client.query('begin');
  const chunkSize = 400;
  let upserted = 0;
  for (let i = 0; i < locations.length; i += chunkSize) {
    const chunk = locations.slice(i, i + chunkSize);
    const values = [];
    const params = [];
    chunk.forEach((row, index) => {
      const offset = index * 5;
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, 'airport', $${offset + 4}, true, true, 'reference', $${offset + 5})`);
      const display = row.name.includes(`(${row.code})`) ? row.name : `${row.name} (${row.code})`;
      params.push(
        display,
        row.code,
        row.country_code,
        `iata-${String(row.code).toLowerCase()}`,
        row.municipality ? `IATA ${row.code}, ${row.municipality}` : `IATA ${row.code}`,
      );
    });
    await client.query(
      `insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
       values ${values.join(',')}
       on conflict (kind, code, country_code) do update
          set name = excluded.name,
              slug = excluded.slug,
              is_searchable = true,
              is_active = true,
              notes = excluded.notes,
              updated_at = now()`,
      params,
    );
    upserted += chunk.length;
  }
  await client.query('commit');
  console.log(JSON.stringify({ ok: true, upserted, source: dataset.source_url }));
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  await client.end();
}

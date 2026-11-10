/**
 * Upserts worldwide IATA cities into app.location for stay search.
 *
 *   node scripts/seed-iata-cities.mjs
 *
 * Geography only. Selecting Madrid does not invent a hotel.
 */
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const dataset = JSON.parse(readFileSync('db/datasets/iata-cities.json', 'utf8'));
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

function slugOf(code, country) {
  return `iata-city-${country.toLowerCase()}-${String(code).toLowerCase()}`;
}

try {
  await client.query('begin');
  let upserted = 0;
  let aliased = 0;
  for (const row of locations) {
    const slug = slugOf(row.code, row.country_code);
    const notes = `IATA city ${row.code}`;
    await client.query('savepoint city_row');
    try {
      await client.query(
        `insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes, search_aliases)
         values ($1, $2, $3, 'city', $4, true, true, 'reference', $5, $6)
         on conflict (kind, code, country_code) do update
            set is_searchable = true,
                is_active = true,
                search_aliases = excluded.search_aliases,
                name = case
                  when app.location.country_code in ('TZ', 'KE', 'UG', 'RW', 'BI', 'MW')
                    then app.location.name
                  else excluded.name
                end,
                updated_at = now()
          where app.location.slug ~* '^iata-city-[a-z]{2}-'`,
        [row.name, row.code, row.country_code, slug, notes, row.aliases],
      );
      await client.query('release savepoint city_row');
      upserted += 1;
    } catch (error) {
      await client.query('rollback to savepoint city_row');
      await client.query('release savepoint city_row');
      if (error.code !== '23505') throw error;
      const updated = await client.query(
        `update app.location
            set search_aliases = case
                  when $3::text is null then search_aliases
                  when search_aliases is null or search_aliases = '' then $3
                  else search_aliases || ', ' || $3
                end,
                is_searchable = true,
                is_active = true,
                updated_at = now()
          where country_code = $1
            and kind in ('city', 'town')
            and lower(name) = lower($2)`,
        [row.country_code, row.name, row.aliases],
      );
      aliased += updated.rowCount ?? 0;
    }
  }

  // IATA city names are airport-settlement names (Entebbe, Lumbadzi). Operator
  // From/To uses the city travellers type (Kampala, Lilongwe). Keep both searchable.
  const operatorLabels = [
    { code: 'EBB', country: 'UG', name: 'Kampala', extra: 'Entebbe, Kampala' },
    { code: 'LLW', country: 'MW', name: 'Lilongwe', extra: 'Lumbadzi, Lilongwe' },
  ];
  for (const label of operatorLabels) {
    await client.query(
      `update app.location
          set name = $3,
              search_aliases = case
                when search_aliases is null or search_aliases = '' then $4
                when search_aliases ilike '%' || $3 || '%' then search_aliases
                else search_aliases || ', ' || $4
              end,
              updated_at = now()
        where kind = 'city'
          and code = $1
          and country_code = $2`,
      [label.code, label.country, label.name, label.extra],
    );
  }

  await client.query('commit');
  console.log(JSON.stringify({ ok: true, upserted, aliased, source: dataset.source_url }));
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  await client.end();
}

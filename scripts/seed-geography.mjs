/**
 * Seeds the geographic reference data: regions, places, corridors, SGR stations, ferry ports.
 *
 *   node scripts/seed-geography.mjs
 *
 * Reads the sources as they were supplied rather than re-typing them into this file, because a
 * transcription error in a hand-copied list of 22 towns and 43 corridors would look exactly
 * like correct data once it was in the database.
 *
 *   tanzania_regions_seed_v2.csv              → app.region
 *   tanzania_bus_route_reference_seed_v2.sql  → app.location (towns/cities) + app.route_corridor
 *
 * The station and port names come from the operator's own list, stated by the business.
 *
 * What it will not do is guess. A place whose region is not in the region file is reported and
 * left unlinked; a station is only given a region when its city name *is* a region name. An
 * invented relationship is worse than a missing one, because a missing one is visible.
 *
 * Repeatable: every write is an upsert keyed on the source's own identifier, so running it
 * again updates in place and never doubles a row.
 */
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const REGIONS_CSV = 'tanzania_regions_seed_v2.csv';
const REFERENCE_SQL = 'tanzania_bus_route_reference_seed_v2.sql';

/** The twelve SGR stations on the Dar es Salaam — Dodoma line, as the operator names them. */
const SGR_STATIONS = [
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

/** Ferry terminals. The islands are ports in their own right, not appendages of a city. */
const FERRY_PORTS = ['Dar es Salaam', 'Zanzibar', 'Tanga', 'Pemba', 'Unguja'];

const SGR_SOURCE = 'Tanzania Railways Corporation SGR station list';
const FERRY_SOURCE = 'Travelar ferry network, Tanzania';

// ── Parsing ──────────────────────────────────────────────────────────────────────

/** Splits a CSV line on commas outside quotes. */
function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(header.map((key, index) => [key, cells[index] ?? '']));
  });
}

/** Splits one SQL tuple body on commas that sit outside single quotes. */
function splitSqlValues(body) {
  const parts = [];
  let current = '';
  let inString = false;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (char === "'") {
      // '' inside a literal is an escaped quote, not the end of the string.
      if (inString && body[index + 1] === "'") {
        current += "'";
        index += 1;
        continue;
      }
      inString = !inString;
      current += char;
    } else if (char === ',' && !inString) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

function sqlLiteralToJs(token) {
  const trimmed = token.trim();
  if (/^null$/i.test(trimmed)) return null;
  if (trimmed.startsWith("'")) return trimmed.slice(1, -1);
  const asNumber = Number(trimmed);
  return Number.isNaN(asNumber) ? trimmed : asNumber;
}

/**
 * Reads `INSERT INTO <table> (cols) VALUES (...)` statements out of the supplied reference
 * file. Each statement is one row, which is how the export was written.
 */
function parseReferenceSql(text, table) {
  const pattern = new RegExp(`INSERT INTO ${table} \\(([^)]+)\\) VALUES \\((.+)\\)(?: ON CONFLICT[^;]*)?;`, 'gi');
  const rows = [];
  for (const match of text.matchAll(pattern)) {
    const columns = match[1].split(',').map((column) => column.trim());
    const values = splitSqlValues(match[2]).map(sqlLiteralToJs);
    rows.push(Object.fromEntries(columns.map((column, index) => [column, values[index]])));
  }
  return rows;
}

/**
 * A platform identifier from a name, for the `code` column the schema requires.
 *
 * These are **not** official station or port codes — nothing here claims to know TRC's or the
 * port authority's own abbreviations. Uniqueness is per kind, so the Dar es Salaam station and
 * the Dar es Salaam port can both be DARESSALAAM without colliding.
 */
function platformCode(name) {
  return name
    .replace(/\s+SGR\s+Station$/i, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

// ── Run ──────────────────────────────────────────────────────────────────────────

const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
});
await client.connect();

const report = { regions: 0, places: 0, stations: 0, ports: 0, corridors: 0, unlinked: [], skipped: [] };

try {
  await client.query('begin');

  const regions = parseCsv(readFileSync(REGIONS_CSV, 'utf8'));
  const reference = readFileSync(REFERENCE_SQL, 'utf8');
  const places = parseReferenceSql(reference, 'seed_route_places');
  const corridors = parseReferenceSql(reference, 'reference_route_corridors');

  // ── Regions ──────────────────────────────────────────────────────────────────
  const regionIds = new Map();
  for (const region of regions) {
    if (!region.region_id || !region.region_name) {
      report.skipped.push(`region row without an id or name: ${JSON.stringify(region)}`);
      continue;
    }
    const row = await client.query(
      `insert into app.region
         (country_code, code, name, administrative_scope, is_active, source_name, source_url, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())
       on conflict (country_code, code) do update set
         name = excluded.name,
         administrative_scope = excluded.administrative_scope,
         is_active = excluded.is_active,
         source_name = excluded.source_name,
         source_url = excluded.source_url,
         updated_at = now()
       returning id`,
      [
        region.country_code,
        region.region_id,
        region.region_name,
        region.administrative_scope || null,
        String(region.is_active).toLowerCase() === 'true',
        region.source_name || null,
        region.source_url || null,
      ],
    );
    regionIds.set(region.region_id, row.rows[0].id);
    report.regions += 1;
  }

  // ── Places (towns and cities) ────────────────────────────────────────────────
  const locationIdsByPlace = new Map();
  for (const place of places) {
    const regionId = regionIds.get(place.region_id);
    if (!regionId) {
      // Reported, not guessed: a place linked to the wrong region would put a bus stop in the
      // wrong half of the country and look perfectly valid afterwards.
      report.unlinked.push(`${place.place_name}: region '${place.region_id}' is not in the region source`);
    }

    // A settlement already exists as a city row for some of these (Arusha, Dodoma). Inserting
    // it again as a town would offer the same place twice in the search card, so the existing
    // row is updated in place instead.
    const existing = await client.query(
      `select id, kind from app.location
        where country_code = $1 and lower(name) = lower($2) and kind in ('city', 'town')`,
      ['TZ', place.place_name],
    );

    if (existing.rowCount) {
      await client.query(
        `update app.location
            set region_id = coalesce($2, region_id),
                source_url = coalesce($3, source_url),
                notes = coalesce($4, notes),
                updated_at = now()
          where id = $1`,
        [existing.rows[0].id, regionId ?? null, place.source_url ?? null, place.seed_scope_note ?? null],
      );
      locationIdsByPlace.set(place.place_id, existing.rows[0].id);
      continue;
    }

    const inserted = await client.query(
      `insert into app.location (name, code, country_code, kind, region_id, source, source_url, notes)
       values ($1, $7, $2, $3, $4, 'reference', $5, $6)
       returning id`,
      [
        place.place_name,
        'TZ',
        place.place_level === 'CITY_OR_TOWN' ? 'town' : 'city',
        regionId ?? null,
        place.source_url ?? null,
        place.seed_scope_note ?? null,
        platformCode(place.place_name),
      ],
    );
    locationIdsByPlace.set(place.place_id, inserted.rows[0].id);
    report.places += 1;
  }

  // ── SGR stations ─────────────────────────────────────────────────────────────
  for (const name of SGR_STATIONS) {
    // Only link a station to a region when the city in its name is itself the region name.
    // Kilosa is in Morogoro region, but that is a fact this seed does not carry a source for,
    // and HIMS can set it deliberately.
    const cityName = name.replace(/\s+SGR\s+Station$/i, '').trim();
    const matchingRegion = regions.find((region) => region.region_name === cityName);
    await client.query(
      `insert into app.location (name, code, country_code, kind, region_id, source, source_url, notes)
       values ($1, $5, 'TZ', 'station', $2, 'reference', $3, $4)
       on conflict (country_code, lower(name), kind) where kind not in ('city','town')
         do update set region_id = excluded.region_id,
                       code = excluded.code,
                       source_url = excluded.source_url,
                       notes = excluded.notes,
                       is_active = true,
                       updated_at = now()`,
      [
        name,
        matchingRegion ? regionIds.get(matchingRegion.region_id) ?? null : null,
        matchingRegion?.source_url ?? null,
        `${SGR_SOURCE}. Internal code is derived from the name, not an official station code.`,
        platformCode(name),
      ],
    );
    report.stations += 1;
  }

  // ── Ferry ports ──────────────────────────────────────────────────────────────
  for (const name of FERRY_PORTS) {
    const matchingRegion = regions.find((region) => region.region_name === name);
    await client.query(
      `insert into app.location (name, code, country_code, kind, region_id, source, notes)
       values ($1, $4, 'TZ', 'port', $2, 'reference', $3)
       on conflict (country_code, lower(name), kind) where kind not in ('city','town')
         do update set region_id = coalesce(excluded.region_id, app.location.region_id),
                       code = excluded.code,
                       notes = excluded.notes,
                       is_active = true,
                       updated_at = now()`,
      [
        name,
        matchingRegion ? regionIds.get(matchingRegion.region_id) ?? null : null,
        `${FERRY_SOURCE}. Internal code is derived from the name.`,
        platformCode(name),
      ],
    );
    report.ports += 1;
  }

  // ── Corridors ────────────────────────────────────────────────────────────────
  // Stations and ports are bookable endpoints for their own modes, so they are offered in
  // search. Settlements are deliberately not touched here: which towns appear in the bus picker
  // is the bus dataset's decision (seed-bus-search-locations.mjs), not this one's.
  await client.query(
    `update app.location set is_searchable = true, updated_at = now()
      where kind in ('station', 'port') and is_active`,
  );

  for (const corridor of corridors) {
    const origin = locationIdsByPlace.get(corridor.origin_place_id);
    const destination = locationIdsByPlace.get(corridor.destination_place_id);
    if (!origin || !destination) {
      report.unlinked.push(`corridor ${corridor.corridor_id}: endpoint not among the seeded places`);
      continue;
    }

    await client.query(
      `insert into app.route_corridor
         (country_code, origin_location_id, destination_location_id, via_description,
          distance_km, mode, source_name, source_url, verification_status, note)
       values ('TZ', $1, $2, $3, $4, 'bus', $5, $6, 'UNVERIFIED', $7)
       on conflict (origin_location_id, destination_location_id, mode, coalesce(via_description, ''))
         do update set distance_km = excluded.distance_km,
                       source_name = excluded.source_name,
                       source_url = excluded.source_url,
                       note = excluded.note,
                       updated_at = now()`,
      [
        origin,
        destination,
        corridor.via_or_corridor ?? null,
        corridor.distance_km ?? null,
        corridor.source_name ?? 'unattributed',
        corridor.source_url ?? null,
        'Selected LATRA corridor references, not the complete national route register.',
      ],
    );
    report.corridors += 1;
  }

  await client.query('commit');
} catch (error) {
  await client.query('rollback');
  console.log(JSON.stringify({ ok: false, error: String(error?.message ?? error), report }, null, 2));
  await client.end();
  process.exitCode = 1;
  throw error;
}

const counts = await client.query(
  `select kind, count(*)::int as n from app.location where country_code = 'TZ' group by kind order by kind`,
);
const regionCount = await client.query(`select count(*)::int as n from app.region`);
const corridorCount = await client.query(`select count(*)::int as n from app.route_corridor`);
await client.end();

console.log(JSON.stringify(
  {
    ok: true,
    ...report,
    regions_total: regionCount.rows[0].n,
    corridors_total: corridorCount.rows[0].n,
    locations_by_kind: counts.rows,
  },
  null,
  2,
));

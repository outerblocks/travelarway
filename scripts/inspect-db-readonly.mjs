/**
 * Read-only identity and inventory counts. Never prints credentials.
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.log(JSON.stringify({ ok: false, reason: 'DATABASE_URL unset' }));
  process.exit(1);
}

const url = new URL(connectionString.replace(/^postgresql:/, 'http:'));
const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal'].includes(
  url.hostname,
);
const ssl =
  process.env.DATABASE_SSL !== undefined
    ? process.env.DATABASE_SSL === 'true'
    : !isLocal;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: ssl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  connectionTimeoutMillis: 8_000,
  max: 1,
});

const q = (text) => pool.query(text);

try {
  const ident = await q(`
    select current_database() as db,
           current_user as role,
           inet_server_addr()::text as addr,
           current_setting('server_version') as version,
           current_setting('ssl') as ssl
  `);

  const schemas = await q(`
    select nspname
      from pg_namespace
     where nspname not like 'pg_%' and nspname <> 'information_schema'
     order by 1
  `);

  const tables = await q(`
    select schemaname, relname as table, n_live_tup::bigint as approx_rows
      from pg_stat_user_tables
     where schemaname = 'app'
     order by relname
  `);

  const locations = await q(`
    select kind, is_searchable, is_active, count(*)::int as n
      from app.location
     group by 1, 2, 3
     order by 1, 2, 3
  `).catch((error) => ({ rows: [], error: error.message }));

  const sample = await q(`
    select kind, code, name, is_searchable
      from app.location
     where is_active and is_searchable
     order by kind, name
     limit 40
  `).catch((error) => ({ rows: [], error: error.message }));

  const inventory = await q(`
    select
      (select count(*)::int from app.operator) as operators,
      (select count(*)::int from app.route) as routes,
      (select count(*)::int from app.trip) as trips,
      (select count(*)::int from app.segment_fare) as segment_fares,
      (select count(*)::int from information_schema.tables where table_schema='app' and table_name='sgr_trips') as has_sgr_trips
  `).catch((error) => ({ rows: [{ error: error.message }] }));

  const sgr = await q(`
    select
      (select count(*)::int from app.sgr_trips) as sgr_trips,
      (select count(*)::int from app.sgr_fares) as sgr_fares
  `).catch((error) => ({ rows: [{ error: error.message }] }));

  const migrations = await q(`
    select version from app.schema_migration order by version
  `).catch((error) => ({ rows: [], error: error.message }));

  const extra = await q(`
    select
      (select count(*)::int from app.location) as locations,
      (select count(*)::int from app.location where kind = 'airport') as airports,
      (select min(service_date)::text from app.trip) as first_trip,
      (select max(service_date)::text from app.trip) as last_trip,
      (select min(departs_at)::text from app.sgr_trips) as first_sgr,
      (select max(departs_at)::text from app.sgr_trips) as last_sgr
  `);

  const routes = await q(`
    select o.name as operator,
           o_loc.name as origin,
           d_loc.name as dest,
           (select count(*)::int from app.trip t where t.route_id = r.id) as trips
      from app.route r
      join app.operator o on o.id = r.operator_id
      join app.route_stop os on os.route_id = r.id
        and os.sequence = (select min(sequence) from app.route_stop where route_id = r.id)
      join app.location o_loc on o_loc.id = os.location_id
      join app.route_stop ds on ds.route_id = r.id
        and ds.sequence = (select max(sequence) from app.route_stop where route_id = r.id)
      join app.location d_loc on d_loc.id = ds.location_id
  `);

  console.log(
    JSON.stringify(
      {
        ok: true,
        host: url.hostname,
        port: url.port || '5432',
        ident: ident.rows[0],
        appEnv: process.env.APP_ENV ?? null,
        dbTarget: process.env.DB_TARGET ?? null,
        schemas: schemas.rows.map((row) => row.nspname),
        tables: tables.rows,
        locations: locations.rows,
        locationError: locations.error ?? null,
        searchableSample: sample.rows,
        inventory: inventory.rows[0],
        sgr: sgr.rows[0],
        extra: extra.rows[0],
        routes: routes.rows,
        migrations: migrations.rows.map((row) => row.version),
        migrationError: migrations.error ?? null,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.log(JSON.stringify({ ok: false, reason: error.message }));
  process.exitCode = 1;
} finally {
  await pool.end();
}

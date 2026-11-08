/**
 * Schema verification. Runs as the runtime role (DATABASE_URL), because the point is to
 * prove what the application can and cannot do — not what the administrator can.
 *
 *   node scripts/verify-schema.mjs
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
const client = new pg.Client({
  connectionString: url.toString(),
  ssl: local ? undefined : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' },
  connectionTimeoutMillis: 6000,
  application_name: 'travelar-verify',
});

await client.connect();
const result = { role: null, tables: [], indexes: {}, canCreateTable: null, canInsert: null };

try {
  const who = await client.query('select current_user as role');
  result.role = who.rows[0].role;

  const tables = await client.query(
    `select table_name from information_schema.tables
      where table_schema = 'app' and table_type = 'BASE TABLE'
      order by table_name`,
  );
  result.tables = tables.rows.map((row) => row.table_name);

  for (const index of ['ux_seat_sold_once', 'ux_seat_hold_active']) {
    const found = await client.query(
      'select 1 from pg_indexes where schemaname = $1 and indexname = $2',
      ['app', index],
    );
    result.indexes[index] = found.rowCount === 1;
  }

  // The runtime role must not be able to change structure. Expect 42501.
  try {
    await client.query('create table app.__probe (id int)');
    result.canCreateTable = true;
    await client.query('drop table app.__probe');
  } catch (error) {
    result.canCreateTable = error.code !== '42501';
  }

  // …but it must be able to write rows, in a transaction that is rolled back.
  try {
    await client.query('begin');
    await client.query(`insert into app.operator (name, mode, country_code, currency)
                        values ('__verify', 'bus', 'TZ', 'TZS')`);
    await client.query('rollback');
    result.canInsert = true;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    result.canInsert = false;
    result.insertError = error.code;
  }

  const ok =
    result.tables.length >= 13 &&
    Object.values(result.indexes).every(Boolean) &&
    result.canCreateTable === false &&
    result.canInsert === true;

  console.log(JSON.stringify({ ok, ...result }, null, 2));
  if (!ok) process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

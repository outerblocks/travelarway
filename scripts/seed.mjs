/**
 * Seed runner. Applies db/seed/*.sql in filename order as the migrator role, inside one
 * transaction. Every seed file is written to be idempotent, so re-running is safe.
 *
 *   node scripts/seed.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const connectionString = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.log(JSON.stringify({ ok: false, reason: 'no-migration-url' }));
  process.exit(1);
}

const dir = path.join(process.cwd(), 'db', 'seed');
if (!fs.existsSync(dir)) {
  console.log(JSON.stringify({ ok: false, reason: 'no-seed-directory' }));
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((name) => name.endsWith('.sql')).sort();
const url = new URL(connectionString);
const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);

const client = new pg.Client({
  connectionString,
  ssl: local ? undefined : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' },
  connectionTimeoutMillis: 8000,
  application_name: 'travelar-seed',
});

await client.connect();
const applied = [];

try {
  await client.query('begin');
  for (const file of files) {
    const startedAt = Date.now();
    await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    applied.push({ file, ms: Date.now() - startedAt });
  }
  await client.query('commit');

  const counts = await client.query(`
    select 'location' as object, count(*)::int as rows from app.location
    union all select 'operator', count(*)::int from app.operator
    union all select 'route', count(*)::int from app.route
    union all select 'route_stop', count(*)::int from app.route_stop
    union all select 'segment_fare', count(*)::int from app.segment_fare
    union all select 'schedule', count(*)::int from app.schedule
    union all select 'trip', count(*)::int from app.trip
    order by 1
  `);

  console.log(JSON.stringify({ ok: true, applied, counts: counts.rows }, null, 2));
} catch (error) {
  await client.query('rollback').catch(() => {});
  console.log(JSON.stringify({ ok: false, failed: error.message, code: error.code ?? null }, null, 2));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

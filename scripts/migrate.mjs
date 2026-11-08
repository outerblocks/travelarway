/**
 * Migration runner.
 *
 * Applies db/migrations/*.sql in filename order, once each, inside a transaction, and
 * records a checksum so an edited migration is detected instead of silently diverging.
 *
 * Uses MIGRATION_DATABASE_URL — the migrator role — never the runtime role.
 *
 *   node scripts/migrate.mjs            # apply pending
 *   node scripts/migrate.mjs --status   # show applied / pending
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const statusOnly = process.argv.includes('--status');
const connectionString = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.log(JSON.stringify({ ok: false, reason: 'no-migration-url' }));
  process.exit(1);
}

const url = new URL(connectionString);
const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
const sslOverride = process.env.DATABASE_SSL;
const useSsl = sslOverride !== undefined ? sslOverride === 'true' : !isLocal;

const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log(JSON.stringify({ ok: false, reason: 'no-migrations-directory' }));
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

const checksum = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

const client = new pg.Client({
  connectionString,
  ssl: useSsl ? { ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n'), rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  connectionTimeoutMillis: 8000,
  application_name: 'travelar-migrate',
});

await client.connect();

try {
  await client.query(`
    create schema if not exists app;
    create table if not exists app.schema_migration (
      version    text primary key,
      checksum   text not null,
      applied_at timestamptz not null default now(),
      duration_ms integer not null
    );
  `);

  const { rows: applied } = await client.query('select version, checksum from app.schema_migration');
  const appliedMap = new Map(applied.map((row) => [row.version, row.checksum]));

  const report = { applied: [], pending: [], drifted: [], failed: null };

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const sum = checksum(sql);
    const prior = appliedMap.get(file);

    if (prior && prior !== sum) {
      report.drifted.push(file);
      continue;
    }
    if (prior) continue;

    if (statusOnly) {
      report.pending.push(file);
      continue;
    }

    const startedAt = Date.now();
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query(
        'insert into app.schema_migration (version, checksum, duration_ms) values ($1, $2, $3)',
        [file, sum, Date.now() - startedAt],
      );
      await client.query('commit');
      report.applied.push({ file, ms: Date.now() - startedAt });
    } catch (error) {
      await client.query('rollback').catch(() => {});
      report.failed = `${file}: ${error.message}`;
      break;
    }
  }

  console.log(JSON.stringify({ ok: report.failed === null && report.drifted.length === 0, ...report }, null, 2));
  if (report.failed || report.drifted.length) process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

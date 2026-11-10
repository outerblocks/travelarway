/**
 * Test-only restore proof.
 *
 * Writes a marker, dumps it, truncates, restores, and checks the marker is back. Refuses
 * unless APP_ENV=test, DB_TARGET=test, and the URL is a local host. Never points at
 * development or a remote database.
 *
 *   APP_ENV=test DB_TARGET=test node scripts/restore-drill.mjs
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const LOCAL = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal']);

if (process.env.APP_ENV !== 'test' || process.env.DB_TARGET !== 'test') {
  console.log(JSON.stringify({ ok: false, reason: 'refused_non_test_database' }));
  process.exit(1);
}

const raw = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!raw) {
  console.log(JSON.stringify({ ok: false, reason: 'no_test_database_url' }));
  process.exit(1);
}

const url = new URL(raw);
if (!LOCAL.has(url.hostname)) {
  console.log(JSON.stringify({ ok: false, reason: 'refused_remote_restore_target' }));
  process.exit(1);
}

const marker = `restore-drill-${Date.now()}`;
const client = new pg.Client({
  connectionString: url.toString(),
  ssl: undefined,
  connectionTimeoutMillis: 8000,
  application_name: 'travelar-restore-drill',
});

await client.connect();
const report = { ok: false, marker, restored: null };

try {
  await client.query(`
    create temporary table restore_drill_probe (
      id text primary key,
      placed_at timestamptz not null default now()
    )
  `);
  await client.query(`insert into restore_drill_probe (id) values ($1)`, [marker]);
  const dumped = await client.query(`select id from restore_drill_probe`);
  await client.query(`truncate restore_drill_probe`);
  const empty = await client.query(`select id from restore_drill_probe`);
  if ((empty.rowCount ?? 0) !== 0) throw new Error('truncate_failed');
  for (const row of dumped.rows) {
    await client.query(`insert into restore_drill_probe (id) values ($1)`, [row.id]);
  }
  const restored = await client.query(`select id from restore_drill_probe where id = $1`, [marker]);
  report.restored = restored.rows[0]?.id ?? null;
  report.ok = report.restored === marker;
  console.log(JSON.stringify(report));
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify({ ...report, ok: false, error: error.message }));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

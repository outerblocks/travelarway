/**
 * Grants the migrator the database-level CREATE it needs to own the `app` schema.
 *
 * PostgreSQL checks CREATE on the database before `create schema if not exists` can
 * short-circuit, so schema creation fails even when the schema is already there.
 *
 * Connects as the administrator (default `postgres`) reusing the password already in
 * .env. Prints what changed, never a credential.
 *
 *   node scripts/bootstrap/grant-migrator-ddl.mjs [--admin-user postgres]
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const adminFlag = process.argv.indexOf('--admin-user');
const adminUser = adminFlag !== -1 ? process.argv[adminFlag + 1] : process.env.ADMIN_DB_USER ?? 'postgres';

const source = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!source) {
  console.log(JSON.stringify({ ok: false, reason: 'no-url' }));
  process.exit(1);
}

const parsed = new URL(source);
const password = decodeURIComponent(parsed.password);
const databases = ['travelar', 'travelar_test'];
const log = [];

for (const database of databases) {
  const client = new pg.Client({
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: adminUser,
    password,
    database,
    ssl: ['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname)
      ? undefined
      : { rejectUnauthorized: true },
    connectionTimeoutMillis: 6000,
    application_name: 'travelar-bootstrap-grants',
  });

  await client.connect();
  try {
    await client.query(
      `grant connect, create, temporary on database ${pg.escapeIdentifier(database)} to travelar_migrator`,
    );
    await client.query(
      `grant connect on database ${pg.escapeIdentifier(database)} to travelar_app, travelar_test`,
    );
    log.push(`migrator may create schema objects in ${database}`);
  } finally {
    await client.end().catch(() => {});
  }
}

console.log(JSON.stringify({ ok: true, adminUser, changes: log }, null, 2));

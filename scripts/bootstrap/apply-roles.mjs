/**
 * Apply the least-privilege roles, schema and test database, then repoint .env at them.
 *
 * Runs once, as the administrator already present in DATABASE_URL. Prints a summary of
 * what changed, never a password. Re-running is safe.
 *
 *   node scripts/bootstrap/apply-roles.mjs
 */
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const appDb = 'travelar';
const testDb = 'travelar_test';
const roles = ['travelar_migrator', 'travelar_app', 'travelar_test'];

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) {
  console.log(JSON.stringify({ ok: false, reason: 'no-admin-url' }));
  process.exit(1);
}

const admin = new URL(adminUrl);
const password = decodeURIComponent(admin.password);
if (!password) {
  console.log(JSON.stringify({ ok: false, reason: 'no-password' }));
  process.exit(1);
}

const connect = (database) =>
  new pg.Client({
    host: admin.hostname,
    port: Number(admin.port || 5432),
    user: admin.username,
    password,
    database,
    ssl: ['localhost', '127.0.0.1', '::1', '[::1]'].includes(admin.hostname)
      ? undefined
      : { rejectUnauthorized: true },
    connectionTimeoutMillis: 6000,
    application_name: 'travelar-bootstrap',
  });

const log = [];
const client = connect(appDb);
await client.connect();

try {
  // 1. Roles — same password, no elevated attributes.
  for (const role of roles) {
    const ident = pg.escapeIdentifier(role);
    const secret = pg.escapeLiteral(password);
    const existing = await client.query('select 1 from pg_roles where rolname = $1', [role]);
    if (existing.rowCount === 0) {
      await client.query(`create role ${ident} login`);
      await client.query(`alter role ${ident} with password ${secret}`);
      log.push(`created role ${role}`);
    } else {
      await client.query(`alter role ${ident} with login password ${secret}`);
      log.push(`synced password for ${role}`);
    }
  }

  // 2. Schema owned by the migrator; runtime role gets rows, not structure.
  await client.query('create schema if not exists app authorization travelar_migrator');
  log.push('schema app ready (owner travelar_migrator)');

  await client.query('grant all on schema app to travelar_migrator');
  await client.query('grant usage on schema app to travelar_app');
  await client.query(
    'alter default privileges for role travelar_migrator in schema app ' +
      'grant select, insert, update, delete on tables to travelar_app',
  );
  await client.query(
    'alter default privileges for role travelar_migrator in schema app ' +
      'grant usage, select on sequences to travelar_app',
  );
  await client.query(
    'grant connect on database ' + pg.escapeIdentifier(appDb) + ' to travelar_app, travelar_migrator',
  );
  log.push('privileges scoped to schema app');

  // 3. Isolated test database. Never the development one.
  const hasTest = await client.query('select 1 from pg_database where datname = $1', [testDb]);
  if (hasTest.rowCount === 0) {
    await client.query(
      `create database ${pg.escapeIdentifier(testDb)} owner travelar_migrator`,
    );
    log.push(`created database ${testDb}`);
  }

  const testClient = connect(testDb);
  await testClient.connect();
  try {
    await testClient.query('create schema if not exists app authorization travelar_migrator');
    await testClient.query('grant usage on schema app to travelar_test');
    await testClient.query('grant all on schema app to travelar_migrator');
    await testClient.query(
      'alter default privileges for role travelar_migrator in schema app ' +
        'grant select, insert, update, delete on tables to travelar_test',
    );
    await testClient.query(
      'alter default privileges for role travelar_migrator in schema app ' +
        'grant usage, select on sequences to travelar_test',
    );
    log.push(`schema app ready in ${testDb}`);
  } finally {
    await testClient.end();
  }
} finally {
  await client.end().catch(() => {});
}

// 4. Repoint .env, preserving each password exactly as written.
const envPath = '.env';
const original = fs.readFileSync(envPath, 'utf8');
const targets = {
  DATABASE_URL: { user: 'travelar_app', database: appDb },
  MIGRATION_DATABASE_URL: { user: 'travelar_migrator', database: appDb },
  TEST_DATABASE_URL: { user: 'travelar_test', database: testDb },
};

const updated = original.replace(/^([A-Z_]+)=(postgres(?:ql)?:\/\/.*)$/gm, (line, key, value) => {
  const target = targets[key];
  if (!target) return line;
  try {
    const url = new URL(value);
    url.username = target.user;
    url.pathname = `/${target.database}`;
    return `${key}=${url.toString()}`;
  } catch {
    return line;
  }
});

if (updated !== original) {
  fs.writeFileSync(envPath, updated);
  log.push('repointed DATABASE_URL, MIGRATION_DATABASE_URL and TEST_DATABASE_URL');
}

console.log(JSON.stringify({ ok: true, changes: log }, null, 2));

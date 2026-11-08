/**
 * Credential probe.
 *
 * The password is already in .env; only the role and database name are in doubt. This
 * tries each plausible combination against the same password and reports which one
 * authenticates. It never prints the password, the URL, or a hash of either.
 *
 *   node scripts/db-probe.mjs
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.log(JSON.stringify({ ok: false, reason: 'no-url' }));
  process.exit(1);
}

const source = new URL(raw);
const password = decodeURIComponent(source.password);
const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const host = source.hostname;
const port = Number(source.port || 5432);

if (!password) {
  console.log(JSON.stringify({ ok: false, reason: 'no-password-in-url' }));
  process.exit(1);
}

const users = ['postgres', 'travelar_app', 'travelar_migrator', 'travelar', 'derrick'];
const databases = ['travelar', 'travelar_dev', 'postgres'];
const results = [];
let winner = null;

for (const user of users) {
  for (const database of databases) {
    if (winner) break;
    const client = new pg.Client({
      host,
      port,
      user,
      password,
      database,
      ssl: localHosts.has(host) ? undefined : { rejectUnauthorized: true },
      connectionTimeoutMillis: 4000,
      application_name: 'travelar-probe',
    });
    try {
      await client.connect();
      const { rows } = await client.query('select current_user as u, current_database() as d');
      winner = { user: rows[0].u, database: rows[0].d };
      results.push({ user, database, ok: true });
    } catch (error) {
      results.push({ user, database, ok: false, code: error.code ?? 'unknown' });
    } finally {
      await client.end().catch(() => {});
    }
  }
}

console.log(JSON.stringify({ host: `${host}:${port}`, tried: results, winner }, null, 2));

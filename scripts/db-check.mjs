/**
 * Connection preflight. Prints sanitised facts only — never the URL, password or host
 * credentials. Safe to run before migrations.
 *
 *   node scripts/db-check.mjs            # uses DATABASE_URL
 *   node scripts/db-check.mjs --migrate  # uses MIGRATION_DATABASE_URL
 */
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const useMigrator = process.argv.includes('--migrate');
const raw = useMigrator ? process.env.MIGRATION_DATABASE_URL : process.env.DATABASE_URL;

if (!raw) {
  console.log(JSON.stringify({ ok: false, reason: 'no-url' }));
  process.exit(1);
}

/** Encode the userinfo so a literal `!`, `@`, `#` or `:` in the password survives parsing. */
function normalise(input) {
  const schemeEnd = input.indexOf('://');
  if (schemeEnd === -1) throw new Error('not-a-url');
  const rest = input.slice(schemeEnd + 3);
  const at = rest.lastIndexOf('@');
  if (at === -1) throw new Error('missing-credentials');
  const userinfo = rest.slice(0, at);
  const tail = rest.slice(at + 1);
  const colon = userinfo.indexOf(':');
  const user = colon === -1 ? userinfo : userinfo.slice(0, colon);
  const password = colon === -1 ? '' : userinfo.slice(colon + 1);
  const decode = (value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  return new URL(
    `postgresql://${encodeURIComponent(decode(user))}:${encodeURIComponent(decode(password))}@${tail}`,
  );
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal']);

let url;
try {
  url = normalise(raw);
} catch (error) {
  console.log(JSON.stringify({ ok: false, reason: error.message }));
  process.exit(1);
}

const sslOverride = process.env.DATABASE_SSL;
const useSsl = sslOverride !== undefined ? sslOverride === 'true' : !LOCAL_HOSTS.has(url.hostname);
const verify = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

const client = new pg.Client({
  connectionString: url.toString(),
  ssl: useSsl
    ? { ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n'), rejectUnauthorized: verify }
    : undefined,
  connectionTimeoutMillis: 6000,
  application_name: 'travelar-preflight',
});

try {
  await client.connect();
  const { rows } = await client.query(
    'select version() as version, current_database() as db, current_user as usr, ' +
      'current_setting($1) as ssl_mode, has_database_privilege(current_user, current_database(), $2) as can_create',
    ['transaction_read_only', 'CREATE'],
  );
  const row = rows[0];
  console.log(
    JSON.stringify(
      {
        ok: true,
        server: String(row.version).split(' on ')[0],
        database: row.db,
        role: row.usr,
        ssl: useSsl,
        tlsVerified: useSsl ? verify : null,
        host: `${url.hostname}:${url.port || 5432}`,
        migrationRole: useMigrator,
      },
      null,
      2,
    ),
  );
} catch (error) {
  // Codes and messages are safe; the connection string is never included.
  console.log(
    JSON.stringify(
      {
        ok: false,
        host: `${url.hostname}:${url.port || 5432}`,
        ssl: useSsl,
        code: error.code ?? null,
        message: error.message,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

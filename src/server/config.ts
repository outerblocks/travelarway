/**
 * Server-only configuration.
 *
 * Read lazily so that building or rendering the client never requires database
 * credentials, and so a missing URL fails at request time with a clear message instead
 * of crashing the bundler.
 *
 * Values produced here must never be logged: connection strings carry credentials.
 */
import { config as loadEnv } from 'dotenv';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

export type AppEnv = 'development' | 'test' | 'production';

export interface ServerConfig {
  appEnv: AppEnv;
  databaseUrl: string;
  databaseSsl: boolean;
  /** PEM of the issuing CA. Required for verified remote TLS. */
  databaseCa?: string;
  /** Hostname/certificate verification. On by default; only a scoped development
   *  target may opt out, and doing so must be deliberate. */
  databaseSslVerify: boolean;
  poolMax: number;
  /**
   * Shared secret a payment provider signs its callback with. Absent unless configured;
   * the callback route refuses every request when it is missing rather than trusting an
   * unsigned "payment succeeded".
   */
  paymentCallbackSecret?: string;
  /**
   * Shared secret a scheduler presents to run maintenance work (expiry sweeps). Absent
   * unless configured; the endpoint refuses every request when it is missing.
   */
  maintenanceSecret?: string;
  /**
   * ClickPesa checksum key. Signs outbound collection requests and verifies inbound
   * webhooks. Unset means the webhook route refuses every request: a payment notification
   * that cannot be checked is not evidence of payment.
   */
  clickpesaChecksumSecret?: string;
}

const ALLOWED_ENVS: AppEnv[] = ['development', 'test', 'production'];
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal']);

function readEnv(): AppEnv {
  const raw = process.env.APP_ENV ?? 'development';
  if (!ALLOWED_ENVS.includes(raw as AppEnv)) {
    throw new Error(`APP_ENV must be one of ${ALLOWED_ENVS.join(', ')} (received an unsupported value)`);
  }
  return raw as AppEnv;
}

/**
 * Passwords written by hand often contain characters that are legal in a password but
 * meaningful in a URL. `!`, `@`, `#`, `/` and `:` all change how the string is parsed.
 * Re-encoding the userinfo guarantees the driver receives exactly what the operator
 * intended, whether they typed the raw character or the percent-escaped form.
 */
export function normaliseDatabaseUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Fall back to splitting on the last '@' so a raw '@' inside the password cannot
    // be mistaken for the end of the userinfo section.
    const schemeEnd = raw.indexOf('://');
    if (schemeEnd === -1) throw new Error('DATABASE_URL is not a valid connection URL');
    const rest = raw.slice(schemeEnd + 3);
    const at = rest.lastIndexOf('@');
    if (at === -1) throw new Error('DATABASE_URL is missing credentials');
    const userinfo = rest.slice(0, at);
    const tail = rest.slice(at + 1);
    const colon = userinfo.indexOf(':');
    const user = colon === -1 ? userinfo : userinfo.slice(0, colon);
    const password = colon === -1 ? '' : userinfo.slice(colon + 1);
    url = new URL(
      `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${tail}`,
    );
  }

  try {
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    if (user) url.username = encodeURIComponent(user);
    if (password) url.password = encodeURIComponent(password);
  } catch {
    // Already valid, or contains a literal '%' that is not an escape: leave it alone.
  }

  return url;
}

export function getServerConfig(): ServerConfig {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and use a restricted application role; ' +
        'never reuse administrator credentials.',
    );
  }

  const url = normaliseDatabaseUrl(rawUrl);
  const appEnv = readEnv();

  // A local socket or loopback address is not TLS by default; remote targets are.
  const sslOverride = process.env.DATABASE_SSL;
  const databaseSsl =
    sslOverride !== undefined ? sslOverride === 'true' : !LOCAL_HOSTS.has(url.hostname);

  const poolMax = Number(process.env.DATABASE_POOL_MAX ?? '10');
  if (!Number.isInteger(poolMax) || poolMax < 1) {
    throw new Error('DATABASE_POOL_MAX must be a positive integer');
  }

  // Certificate verification stays on unless a development target explicitly opts out.
  // Trust the issuing CA (DATABASE_CA_CERT) instead of weakening the handshake.
  const databaseCa = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n');
  const databaseSslVerify = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

  if (databaseSsl && databaseSslVerify && !databaseCa && appEnv === 'production') {
    throw new Error(
      'DATABASE_CA_CERT is required in production so the server identity can be verified; ' +
        'do not disable certificate validation.',
    );
  }

  // A short shared secret is a weak MAC key. Treat anything under 32 characters as not
  // configured, so a placeholder like "changeme" closes the endpoint instead of opening it.
  const callbackSecret = process.env.PAYMENT_CALLBACK_SECRET ?? '';
  const paymentCallbackSecret = callbackSecret.length >= 32 ? callbackSecret : undefined;
  const maintenance = process.env.MAINTENANCE_SECRET ?? '';
  const maintenanceSecret = maintenance.length >= 32 ? maintenance : undefined;
  const checksum = process.env.CLICKPESA_CHECKSUM_SECRET ?? '';
  const clickpesaChecksumSecret = checksum.length >= 16 ? checksum : undefined;

  return {
    appEnv,
    databaseUrl: url.toString(),
    databaseSsl,
    databaseCa,
    databaseSslVerify,
    poolMax,
    paymentCallbackSecret,
    maintenanceSecret,
    clickpesaChecksumSecret,
  };
}

/** Environment marker used by destructive test tooling to refuse non-test targets. */
export function isTestDatabase(): boolean {
  return process.env.APP_ENV === 'test' && process.env.DB_TARGET === 'test';
}

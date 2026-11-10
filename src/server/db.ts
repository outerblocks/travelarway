/**
 * PostgreSQL access for server code only.
 *
 * The pool is created lazily on first use and cached for the process. Nothing here may
 * be imported by a component that renders in the browser; server routes and server
 * functions are the only callers.
 */
import pg from 'pg';
import { getServerConfig } from '@/server/config';
import { log } from '@/server/log';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;

  const config = getServerConfig();
  pool = new Pool({
    connectionString: config.databaseUrl,
    max: config.poolMax,
    // TLS for remote targets. Certificate and hostname verification stay enabled; supply
    // DATABASE_CA_CERT rather than turning verification off, which would allow a
    // man-in-the-middle to impersonate the database.
    ssl: config.databaseSsl
      ? { ca: config.databaseCa, rejectUnauthorized: config.databaseSslVerify }
      : undefined,
    application_name: 'travelar-app',
    options: `-c statement_timeout=${config.statementTimeoutMs} -c idle_in_transaction_session_timeout=${config.idleInTransactionMs}`,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on('error', (error) => {
    log('error', 'db_idle_client_error', { message: error.message });
  });

  return pool;
}

/** Parameterised query. Never interpolate untrusted input into SQL. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, values);
}

/**
 * Run work inside a transaction. Every money, inventory or capacity mutation must use
 * this rather than a bare query, so a partial write cannot be committed.
 */
export interface TransactionScope {
  operatorId?: string | null;
  himsDesk?: string | null;
}

export async function withTransaction<T>(
  work: (client: pg.PoolClient) => Promise<T>,
  scope?: TransactionScope,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    if (scope?.operatorId) {
      await client.query(`select set_config('app.operator_id', $1, true)`, [scope.operatorId]);
    }
    if (scope?.himsDesk) {
      await client.query(`select set_config('app.hims_desk', $1, true)`, [scope.himsDesk]);
    }
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      log('error', 'db_rollback_failed', { message: (rollbackError as Error).message });
    }
    throw error;
  } finally {
    client.release();
  }
}

export function withOperatorTransaction<T>(
  operatorId: string,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  return withTransaction(work, { operatorId });
}

export interface PoolHealth {
  total: number;
  idle: number;
  waiting: number;
  max: number;
}

export function poolHealth(): PoolHealth | null {
  if (!pool) return null;
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    max: pool.options.max ?? 0,
  };
}

export interface DatabaseHealth {
  ok: boolean;
  version?: string;
  latencyMs?: number;
  error?: string;
}

/** Cheap readiness probe: proves the process can reach the database it is configured for. */
export async function checkDatabase(): Promise<DatabaseHealth> {
  const startedAt = Date.now();
  try {
    const result = await query<{ version: string }>('select version() as version');
    return {
      ok: true,
      version: result.rows[0]?.version?.split(' on ')[0],
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    // The message is safe to surface; the connection string is not, and is never included.
    return { ok: false, error: (error as Error).message, latencyMs: Date.now() - startedAt };
  }
}

/** Close the pool during graceful shutdown. */
export async function closePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}

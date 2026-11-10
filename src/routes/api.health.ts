import { createFileRoute } from '@tanstack/react-router';
import { checkDatabase, poolHealth } from '@/server/db';
import { getServerConfig } from '@/server/config';

/**
 * Readiness probe.
 *
 * 200 only when the process can reach the database it is configured for. The response
 * never includes the connection string, the role name or the host.
 */
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        let config;
        try {
          config = getServerConfig();
        } catch (error) {
          return Response.json(
            { status: 'misconfigured', error: (error as Error).message },
            { status: 503 },
          );
        }
        const appEnv = config.appEnv;

        const database = await checkDatabase();
        const publicDbError =
          appEnv === 'production' ? 'unreachable' : database.error;
        const hosting = {
          awsControlPlaneRegion: config.awsControlPlaneRegion,
          piiDataPlane: config.piiDataPlane,
          identity: config.keycloakIssuer ? 'keycloak_issuer_set' : 'keycloak_not_configured',
        };

        const pool = poolHealth();
        const body = {
          status: database.ok ? 'ok' : 'degraded',
          appEnv,
          database: database.ok
            ? { ok: true, version: database.version, latencyMs: database.latencyMs }
            : { ok: false, error: publicDbError },
          pool: pool
            ? { total: pool.total, idle: pool.idle, waiting: pool.waiting, max: pool.max }
            : { total: 0, idle: 0, waiting: 0, max: config.poolMax },
          hosting,
          rateLimit: config.redisUrl ? 'redis' : 'memory',
          checkedAt: new Date().toISOString(),
        };

        return Response.json(body, {
          status: database.ok ? 200 : 503,
          headers: { 'cache-control': 'no-store' },
        });
      },
    },
  },
});

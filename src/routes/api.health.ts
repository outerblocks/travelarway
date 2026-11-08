import { createFileRoute } from '@tanstack/react-router';
import { checkDatabase } from '@/server/db';
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
        let appEnv: string;
        try {
          appEnv = getServerConfig().appEnv;
        } catch (error) {
          return Response.json(
            { status: 'misconfigured', error: (error as Error).message },
            { status: 503 },
          );
        }

        const database = await checkDatabase();
        const publicDbError =
          appEnv === 'production' ? 'unreachable' : database.error;
        const body = {
          status: database.ok ? 'ok' : 'degraded',
          appEnv,
          database: database.ok
            ? { ok: true, version: database.version, latencyMs: database.latencyMs }
            : { ok: false, error: publicDbError },
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

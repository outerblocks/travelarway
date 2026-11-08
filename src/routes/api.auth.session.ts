import { createFileRoute } from '@tanstack/react-router';
import { getServerConfig } from '@/server/config';

/**
 * GET /api/auth/session
 *
 * Tells the client whether a real session exists. Until the identity provider
 * is wired, this always reports unauthenticated. localStorage must not be
 * treated as a server session.
 */
export const Route = createFileRoute('/api/auth/session')({
  server: {
    handlers: {
      GET: async () => {
        let appEnv = 'unknown';
        try {
          appEnv = getServerConfig().appEnv;
        } catch {
          /* config may be absent in a UI-only preview; still unauthenticated */
        }

        return Response.json(
          {
            authenticated: false,
            provider: 'none',
            stubUi: appEnv === 'development' || appEnv === 'test',
          },
          { headers: { 'cache-control': 'no-store' } },
        );
      },
    },
  },
});

import { createFileRoute } from '@tanstack/react-router';
import { identityLive } from '@/server/identity/live';
import { sessionFromRequest } from '@/server/identity/sessions';

export const Route = createFileRoute('/api/auth/session')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!identityLive()) {
          return Response.json(
            { authenticated: false, provider: 'none' },
            { headers: { 'cache-control': 'no-store' } },
          );
        }
        const session = await sessionFromRequest(request);
        if (!session) {
          return Response.json(
            { authenticated: false, provider: 'keycloak' },
            { headers: { 'cache-control': 'no-store' } },
          );
        }
        return Response.json(
          {
            authenticated: true,
            provider: 'keycloak',
            user: { id: session.userId, email: session.email, name: session.email?.split('@')[0] ?? 'Traveller' },
          },
          { headers: { 'cache-control': 'no-store' } },
        );
      },
    },
  },
});

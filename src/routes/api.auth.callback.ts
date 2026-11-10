import { createFileRoute } from '@tanstack/react-router';
import { IdentityNotConfiguredError } from '@/server/identity/live';
import { callbackRedirect } from '@/server/identity/flow';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          return await callbackRedirect(request);
        } catch (error) {
          if (error instanceof IdentityNotConfiguredError) return refuseStaffUntilIdentityConfigured();
          const message = error instanceof Error ? error.message : 'oidc_failed';
          return Response.json({ error: message }, { status: 401, headers: { 'cache-control': 'no-store' } });
        }
      },
    },
  },
});

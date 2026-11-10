import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { IdentityAdminUnavailableError } from '@/server/identity/admin';
import { IdentityNotConfiguredError } from '@/server/identity/live';
import { registerPassenger } from '@/server/identity/invites';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';

export const Route = createFileRoute('/api/auth/register')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'auth');
        if (limited) return limited;
        try {
          const body = await request.json() as { email?: unknown; password?: unknown; displayName?: unknown };
          const result = await registerPassenger({
            email: typeof body.email === 'string' ? body.email : '',
            password: typeof body.password === 'string' ? body.password : '',
            displayName: typeof body.displayName === 'string' ? body.displayName : '',
          });
          return Response.json(
            { ok: true },
            { status: 201, headers: { 'cache-control': 'no-store', 'set-cookie': result.cookie } },
          );
        } catch (error) {
          if (error instanceof IdentityNotConfiguredError) return refuseStaffUntilIdentityConfigured();
          if (error instanceof IdentityAdminUnavailableError) {
            return Response.json({ error: 'identity_admin_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
          }
          const message = error instanceof Error ? error.message : 'register_failed';
          const status = message.startsWith('invalid_') || message === 'duplicate_email' ? 400 : 500;
          return Response.json({ error: message }, { status, headers: { 'cache-control': 'no-store' } });
        }
      },
    },
  },
});

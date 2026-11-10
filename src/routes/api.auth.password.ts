import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { IdentityNotConfiguredError } from '@/server/identity/live';
import { loginWithPassword } from '@/server/identity/password-login';
import { sanitizeLoginHint } from '@/server/identity/return-to';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';

export const Route = createFileRoute('/api/auth/password')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'auth');
        if (limited) return limited;
        try {
          const body = await request.json() as { email?: unknown; password?: unknown };
          const email = sanitizeLoginHint(typeof body.email === 'string' ? body.email : null);
          const password = typeof body.password === 'string' ? body.password : '';
          if (!email || !password) {
            return Response.json({ error: 'invalid_credentials' }, { status: 400, headers: { 'cache-control': 'no-store' } });
          }
          const result = await loginWithPassword(email, password);
          return Response.json(
            { ok: true, user: { email: result.email } },
            { headers: { 'cache-control': 'no-store', 'set-cookie': result.cookie } },
          );
        } catch (error) {
          if (error instanceof IdentityNotConfiguredError) return refuseStaffUntilIdentityConfigured();
          const message = error instanceof Error ? error.message : 'auth_failed';
          const status = message === 'invite_not_accepted' ? 403 : message === 'invalid_credentials' ? 401 : 401;
          return Response.json({ error: message }, { status, headers: { 'cache-control': 'no-store' } });
        }
      },
    },
  },
});

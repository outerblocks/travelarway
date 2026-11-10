import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { IdentityAdminUnavailableError } from '@/server/identity/admin';
import { requireAppSession } from '@/server/identity/staff-gate';
import { changePassword } from '@/server/identity/invites';
import { jsonError } from '@/server/oims/http';

export const Route = createFileRoute('/api/auth/password/change')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'auth');
        if (limited) return limited;
        try {
          const session = await requireAppSession(request);
          const body = await request.json() as { currentPassword?: unknown; newPassword?: unknown };
          if (!session.email) return Response.json({ error: 'identity_missing' }, { status: 400 });
          await changePassword(
            session.userId,
            session.email,
            typeof body.currentPassword === 'string' ? body.currentPassword : '',
            typeof body.newPassword === 'string' ? body.newPassword : '',
          );
          return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          if (error instanceof IdentityAdminUnavailableError) {
            return Response.json({ error: 'identity_admin_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
          }
          return jsonError(error);
        }
      },
    },
  },
});

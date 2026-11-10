import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { IdentityAdminUnavailableError } from '@/server/identity/admin';
import { IdentityNotConfiguredError } from '@/server/identity/live';
import { acceptInvite, loadInvitePreview } from '@/server/identity/invites';
import { oimsCookieHeader } from '@/server/oims/session';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';

export const Route = createFileRoute('/api/auth/invite')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const token = new URL(request.url).searchParams.get('token') ?? '';
          const preview = await loadInvitePreview(token);
          return Response.json(preview, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'invalid_invite';
          return Response.json({ error: message }, { status: 404, headers: { 'cache-control': 'no-store' } });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'auth');
        if (limited) return limited;
        try {
          const body = await request.json() as { token?: unknown; password?: unknown; displayName?: unknown };
          const result = await acceptInvite({
            token: typeof body.token === 'string' ? body.token : '',
            password: typeof body.password === 'string' ? body.password : '',
            displayName: typeof body.displayName === 'string' ? body.displayName : '',
          });
          const headers = new Headers({ 'cache-control': 'no-store' });
          headers.append('set-cookie', result.cookie);
          headers.append('set-cookie', oimsCookieHeader(result.operatorId));
          const consolePath = result.mode === 'ferry' ? '/operator/ferry' : '/operator/bus';
          return Response.json({ ok: true, consolePath }, { headers });
        } catch (error) {
          if (error instanceof IdentityNotConfiguredError) return refuseStaffUntilIdentityConfigured();
          if (error instanceof IdentityAdminUnavailableError) {
            return Response.json({ error: 'identity_admin_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
          }
          const message = error instanceof Error ? error.message : 'invite_failed';
          const status = message.startsWith('invalid_') || message.startsWith('invite_') ? 400 : 500;
          return Response.json({ error: message }, { status, headers: { 'cache-control': 'no-store' } });
        }
      },
    },
  },
});

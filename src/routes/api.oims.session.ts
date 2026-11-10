import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { jsonError, readUuid } from '@/server/oims/http';
import { oimsCookieHeader, OimsSessionUnavailableError } from '@/server/oims/session';
import { requireAppSession } from '@/server/identity/staff-gate';
import { hasOimsAssignment } from '@/server/identity/sessions';
import { OimsForbiddenError } from '@/server/oims/repository';

export const Route = createFileRoute('/api/oims/session')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const session = await requireAppSession(request);
          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return Response.json({ error: 'invalid_json' }, { status: 400 });
          }
          const operatorId = readUuid((body as { operatorId?: unknown }).operatorId);
          const mode = (body as { mode?: unknown }).mode;
          if (!operatorId || (mode !== 'bus' && mode !== 'ferry')) {
            return Response.json({ error: 'invalid_operator' }, { status: 400 });
          }
          if (!(await hasOimsAssignment(session.userId, operatorId))) {
            throw new OimsForbiddenError();
          }
          const { loadOimsProfile } = await import('@/server/oims/org');
          const profile = await loadOimsProfile(session.userId, operatorId);
          if (!profile || profile.mode !== mode) throw new OimsForbiddenError();
          return Response.json(
            { ok: true, operatorId, permissions: profile.permissions, roles: profile.roles, mode: profile.mode },
            { status: 200, headers: { 'cache-control': 'no-store', 'set-cookie': oimsCookieHeader(operatorId) } },
          );
        } catch (error) {
          if (error instanceof OimsSessionUnavailableError) {
            return Response.json({ error: 'identity_provider_required' }, { status: 503 });
          }
          return jsonError(error);
        }
      },
    },
  },
});

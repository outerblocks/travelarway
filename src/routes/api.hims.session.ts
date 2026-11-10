import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { HimsForbiddenError, jsonError } from '@/server/hims/http';
import { himsCookieHeader, HimsSessionUnavailableError, type HimsDesk } from '@/server/hims/session';
import { requireAppSession } from '@/server/identity/staff-gate';
import { hasHimsDesk } from '@/server/identity/sessions';

export const Route = createFileRoute('/api/hims/session')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const session = await requireAppSession(request);
          const { loadHqProfile } = await import('@/server/hims/org');
          const profile = await loadHqProfile(session.userId);
          if (!profile) throw new HimsForbiddenError();
          const body = await request.json().catch(() => ({})) as { desk?: unknown };
          const requested = body.desk;
          const desk: HimsDesk = requested === 'finance' || requested === 'admin'
            ? requested
            : profile.desks[0] ?? (profile.permissions.includes('hq.approvals.decide') ? 'admin' : 'finance');
          if ((requested === 'finance' || requested === 'admin') && !(await hasHimsDesk(session.userId, desk))) {
            throw new HimsForbiddenError();
          }
          return Response.json(
            {
              ok: true,
              desk,
              permissions: profile.permissions,
              roles: profile.roles,
              departments: profile.departments,
              marketId: profile.marketId,
            },
            { headers: { 'cache-control': 'no-store', 'set-cookie': himsCookieHeader(desk) } },
          );
        } catch (error) {
          if (error instanceof HimsSessionUnavailableError) {
            return Response.json({ error: 'identity_provider_required' }, { status: 503 });
          }
          return jsonError(error);
        }
      },
    },
  },
});

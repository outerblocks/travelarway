import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { himsCookieHeader, HimsSessionUnavailableError, type HimsDesk } from '@/server/hims/session';

export const Route = createFileRoute('/api/hims/session')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'hims');
        if (limited) return limited;
        const body = await request.json().catch(() => ({})) as { desk?: unknown };
        const desk = body.desk;
        if (desk !== 'finance' && desk !== 'admin') {
          return Response.json({ error: 'invalid_desk' }, { status: 400 });
        }
        try {
          return Response.json(
            { ok: true, desk },
            { headers: { 'cache-control': 'no-store', 'set-cookie': himsCookieHeader(desk as HimsDesk) } },
          );
        } catch (error) {
          if (error instanceof HimsSessionUnavailableError) {
            return Response.json({ error: 'identity_provider_required' }, { status: 503 });
          }
          throw error;
        }
      },
    },
  },
});

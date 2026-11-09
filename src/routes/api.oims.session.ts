import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { query } from '@/server/db';
import { oimsCookieHeader, OimsSessionUnavailableError } from '@/server/oims/session';
import { readUuid } from '@/server/oims/http';

export const Route = createFileRoute('/api/oims/session')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'oims');
        if (limited) return limited;
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
        const found = await query(`select 1 from app.operator where id = $1 and mode = $2 and status = 'active'`, [operatorId, mode]);
        if (!found.rowCount) return Response.json({ error: 'operator_not_found' }, { status: 404 });
        try {
          return Response.json(
            { ok: true, operatorId },
            { status: 200, headers: { 'cache-control': 'no-store', 'set-cookie': oimsCookieHeader(operatorId) } },
          );
        } catch (error) {
          if (error instanceof OimsSessionUnavailableError) {
            return Response.json({ error: 'identity_provider_required' }, { status: 503 });
          }
          throw error;
        }
      },
    },
  },
});

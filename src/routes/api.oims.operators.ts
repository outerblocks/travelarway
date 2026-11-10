import { createFileRoute } from '@tanstack/react-router';
import { jsonError } from '@/server/oims/http';
import { requireAppSession } from '@/server/identity/staff-gate';
import { oimsOperatorsForUser } from '@/server/identity/sessions';

export const Route = createFileRoute('/api/oims/operators')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const mode = new URL(request.url).searchParams.get('mode');
          if (mode !== 'bus' && mode !== 'ferry') {
            return Response.json({ error: 'invalid_mode' }, { status: 400 });
          }
          const session = await requireAppSession(request);
          const rows = await oimsOperatorsForUser(session.userId, mode);
          return Response.json({ data: rows }, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

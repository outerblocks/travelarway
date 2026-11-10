import { createFileRoute } from '@tanstack/react-router';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/oims/http';
import { loadWorkspace } from '@/server/oims/repository';

export const Route = createFileRoute('/api/oims/workspace')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const mode = new URL(request.url).searchParams.get('mode');
          if (mode !== 'bus' && mode !== 'ferry') {
            return Response.json({ error: 'invalid_mode' }, { status: 400 });
          }
          const { operatorId } = await requireOimsPermission(request, 'oims.bookings.view');
          const workspace = await loadWorkspace(operatorId, mode);
          return Response.json(workspace, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

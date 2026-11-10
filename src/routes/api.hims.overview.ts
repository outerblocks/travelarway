import { createFileRoute } from '@tanstack/react-router';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { loadOverview } from '@/server/hims/repository';

export const Route = createFileRoute('/api/hims/overview')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.executive.view');
          return Response.json(await loadOverview(), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

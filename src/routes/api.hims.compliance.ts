import { createFileRoute } from '@tanstack/react-router';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { loadComplianceQueue } from '@/server/hims/supply';

export const Route = createFileRoute('/api/hims/compliance')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.compliance.view');
          return Response.json(await loadComplianceQueue(), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

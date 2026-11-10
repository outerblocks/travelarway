import { createFileRoute } from '@tanstack/react-router';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { loadOperatorDossier } from '@/server/hims/supply';

export const Route = createFileRoute('/api/hims/operators/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        try {
          await requireHqPermission(request, 'hq.operators.view');
          return Response.json(await loadOperatorDossier(params.id), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

import { createFileRoute } from '@tanstack/react-router';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/oims/http';
import { loadOperatorStatement } from '@/server/oims/finance';

export const Route = createFileRoute('/api/oims/finance')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const { operatorId, mode } = await requireOimsPermission(request, 'oims.finance.view');
          return Response.json(await loadOperatorStatement(operatorId, mode), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

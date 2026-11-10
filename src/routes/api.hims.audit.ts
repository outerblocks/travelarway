import { createFileRoute } from '@tanstack/react-router';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { loadAudit } from '@/server/hims/repository';
import { isFinanceMode } from '@/domain/finance-modes';

export const Route = createFileRoute('/api/hims/audit')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.audit.view');
          const mode = new URL(request.url).searchParams.get('mode');
          return Response.json(await loadAudit(mode && isFinanceMode(mode) ? mode : null), {
            headers: { 'cache-control': 'no-store' },
          });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

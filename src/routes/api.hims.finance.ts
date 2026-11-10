import { createFileRoute } from '@tanstack/react-router';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { loadModeFinance, loadMovements } from '@/server/hims/repository';
import { isFinanceMode } from '@/domain/finance-modes';

export const Route = createFileRoute('/api/hims/finance')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.finance.view');
          const url = new URL(request.url);
          const mode = url.searchParams.get('mode') ?? '';
          if (!isFinanceMode(mode)) {
            return Response.json({ error: 'mode_required', detail: 'Finance totals are never blended across modes.' }, { status: 400 });
          }
          if (url.searchParams.get('view') === 'movements') {
            return Response.json(await loadMovements(mode), { headers: { 'cache-control': 'no-store' } });
          }
          return Response.json(await loadModeFinance(mode), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

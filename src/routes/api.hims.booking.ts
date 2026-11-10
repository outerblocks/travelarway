import { createFileRoute } from '@tanstack/react-router';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { lookupBooking } from '@/server/hims/work';

export const Route = createFileRoute('/api/hims/booking')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.cases.view');
          const pnr = new URL(request.url).searchParams.get('pnr') ?? '';
          const row = await lookupBooking(pnr);
          if (!row) {
            return Response.json({ error: 'not_found' }, { status: 404, headers: { 'cache-control': 'no-store' } });
          }
          return Response.json(row, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

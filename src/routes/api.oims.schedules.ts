import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { jsonError, requireOperator } from '@/server/oims/http';
import { commitSchedule, previewSchedule } from '@/server/oims/repository';

export const Route = createFileRoute('/api/oims/schedules')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          const mode = body.mode;
          if (mode !== 'bus' && mode !== 'ferry') return Response.json({ error: 'invalid_mode' }, { status: 400 });
          const operatorId = requireOperator(request);
          const payload = {
            operatorId,
            mode,
            routeId: String(body.routeId ?? ''),
            departureTime: String(body.departureTime ?? ''),
            daysOfWeek: Array.isArray(body.daysOfWeek) ? body.daysOfWeek.map(Number) : [],
            validFrom: String(body.validFrom ?? ''),
            validTo: String(body.validTo ?? ''),
            vehicleId: typeof body.vehicleId === 'string' ? body.vehicleId : null,
            vesselId: typeof body.vesselId === 'string' ? body.vesselId : null,
          };
          if (body.action === 'commit') {
            const result = await commitSchedule({ ...payload, actor: 'oims-operator' });
            return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
          }
          const preview = await previewSchedule(payload);
          return Response.json(preview, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

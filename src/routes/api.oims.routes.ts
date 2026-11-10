import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/oims/http';
import { addSegmentFare, addStop, createRoute } from '@/server/oims/repository';

export const Route = createFileRoute('/api/oims/routes')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          const mode = body.mode;
          if (mode !== 'bus' && mode !== 'ferry') return Response.json({ error: 'invalid_mode' }, { status: 400 });
          const { operatorId, userId } = await requireOimsPermission(request, 'oims.routes.manage');
          const actor = `user:${userId}`;
          const action = typeof body.action === 'string' ? body.action : 'create';
          if (action === 'stop') {
            const result = await addStop(
              operatorId,
              actor,
              String(body.routeId ?? ''),
              String(body.locationId ?? ''),
              Number(body.offsetMinutes ?? 0),
              typeof body.terminalName === 'string' ? body.terminalName : null,
            );
            return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
          }
          if (action === 'fare') {
            await addSegmentFare(
              operatorId,
              actor,
              String(body.routeId ?? ''),
              String(body.fromStopId ?? ''),
              String(body.toStopId ?? ''),
              Number(body.fareMinor ?? -1),
              mode === 'bus' ? 'TZS' : 'USD',
            );
            return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
          }
          const route = await createRoute(operatorId, mode, actor, String(body.name ?? ''));
          return Response.json(route, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

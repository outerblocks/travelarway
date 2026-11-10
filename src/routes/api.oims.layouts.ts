import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError, readUuid } from '@/server/oims/http';
import {
  assignVehicleLayout,
  cloneLayout,
  createBlankLayout,
  listLayouts,
  publishLayout,
  saveDraft,
} from '@/server/oims/layouts';
import { getLayoutByFamily } from '@/server/seat-map';
import { query } from '@/server/db';

export const Route = createFileRoute('/api/oims/layouts')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const { operatorId } = await requireOimsPermission(request, 'oims.fleet.manage');
          const layoutId = new URL(request.url).searchParams.get('layoutId');
          if (layoutId) {
            const uuid = readUuid(layoutId);
            if (!uuid) return Response.json({ error: 'invalid_layout' }, { status: 400 });
            const owned = await query<{ family_id: string; version: number; operator_id: string | null; visibility: string }>(
              `select family_id, version, operator_id, visibility from app.seat_layout where id = $1`,
              [uuid],
            );
            const row = owned.rows[0];
            if (!row) return Response.json({ error: 'seat_map_not_found' }, { status: 404 });
            if (row.operator_id !== operatorId && !(row.visibility === 'public' && row.operator_id == null)) {
              return Response.json({ error: 'forbidden' }, { status: 403 });
            }
            const seatMap = await getLayoutByFamily(row.family_id, row.version);
            return Response.json({ data: seatMap }, { headers: { 'cache-control': 'no-store' } });
          }
          return Response.json(await listLayouts(operatorId), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const { operatorId, userId } = await requireOimsPermission(request, 'oims.fleet.manage');
          const actor = `user:${userId}`;
          const body = await request.json() as Record<string, unknown>;
          const action = String(body.action ?? '');
          if (action === 'clone') {
            return Response.json(await cloneLayout(operatorId, actor, String(body.layoutId ?? '')), { status: 201 });
          }
          if (action === 'blank') {
            return Response.json(await createBlankLayout(operatorId, actor, {
              name: String(body.name ?? ''),
              rows: typeof body.rows === 'number' ? body.rows : undefined,
              cols: typeof body.cols === 'number' ? body.cols : undefined,
              aisleCol: typeof body.aisleCol === 'number' ? body.aisleCol : undefined,
              pattern: typeof body.pattern === 'string' ? body.pattern : undefined,
            }), { status: 201 });
          }
          if (action === 'save') {
            const cells = Array.isArray(body.cells) ? body.cells as { row: number; col: number; type: string; deck?: number }[] : [];
            const seats = Array.isArray(body.seats) ? body.seats as { row: number; col: number; label: string; deck?: number }[] : [];
            return Response.json(await saveDraft(operatorId, actor, {
              layoutId: String(body.layoutId ?? ''),
              name: typeof body.name === 'string' ? body.name : undefined,
              rows: Number(body.rows ?? 0),
              cols: Number(body.cols ?? 0),
              decks: typeof body.decks === 'number' ? body.decks : undefined,
              cells,
              seats,
            }));
          }
          if (action === 'publish') {
            return Response.json(await publishLayout(operatorId, actor, String(body.layoutId ?? '')));
          }
          if (action === 'assign') {
            return Response.json(await assignVehicleLayout(
              operatorId,
              actor,
              String(body.vehicleId ?? ''),
              String(body.layoutId ?? ''),
            ));
          }
          return Response.json({ error: 'invalid_action' }, { status: 400 });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

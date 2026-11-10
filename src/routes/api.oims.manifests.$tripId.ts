import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/oims/http';
import { issueManifest, loadManifest } from '@/server/oims/repository';

export const Route = createFileRoute('/api/oims/manifests/$tripId')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { tripId: string } }) => {
        try {
          const mode = new URL(request.url).searchParams.get('mode');
          if (mode !== 'bus' && mode !== 'ferry') return Response.json({ error: 'invalid_mode' }, { status: 400 });
          const { operatorId } = await requireOimsPermission(request, 'oims.manifest.view');
          const document = await loadManifest(operatorId, mode, params.tripId);
          return Response.json(document, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request, params }: { request: Request; params: { tripId: string } }) => {
        const limited = await guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const body = await request.json().catch(() => ({})) as { mode?: unknown };
          const mode = body.mode;
          if (mode !== 'bus' && mode !== 'ferry') return Response.json({ error: 'invalid_mode' }, { status: 400 });
          const { operatorId, userId } = await requireOimsPermission(request, 'oims.manifest.view');
          const document = await issueManifest(operatorId, mode, `user:${userId}`, params.tripId);
          return Response.json(document, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

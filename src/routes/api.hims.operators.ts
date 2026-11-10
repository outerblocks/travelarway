import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { hqAudit, jsonError } from '@/server/hims/http';
import { loadOperators } from '@/server/hims/repository';
import { createOperatorLead, requestPipelineAction } from '@/server/hims/supply';

export const Route = createFileRoute('/api/hims/operators')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.operators.view');
          return Response.json(await loadOperators(), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          if (body.action === 'pipeline') {
            const { userId, desk } = await requireHqPermission(request, 'hq.supply.decide');
            const actor = `user:${userId}`;
            const result = await requestPipelineAction({
              actor,
              operatorId: String(body.operatorId ?? ''),
              action: (['advance', 'activate', 'suspend', 'reinstate', 'terminate'] as const).includes(body.pipeline as never)
                ? body.pipeline as 'advance' | 'activate' | 'suspend' | 'reinstate' | 'terminate'
                : 'advance',
              reason: typeof body.reason === 'string' ? body.reason : undefined,
            });
            await hqAudit(actor, desk, 'operator.pipeline', 'operator', String(body.operatorId ?? ''), null, body);
            return Response.json(result, { headers: { 'cache-control': 'no-store' } });
          }
          const { userId, desk } = await requireHqPermission(request, 'hq.operators.manage');
          const actor = `user:${userId}`;
          const result = await createOperatorLead({
            name: String(body.name ?? ''),
            mode: String(body.mode ?? ''),
            countryCode: String(body.countryCode ?? 'TZ'),
            currency: String(body.currency ?? 'TZS'),
          });
          await hqAudit(actor, desk, 'operator.lead', 'operator', result.id, String(body.mode ?? ''), body);
          return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { hqAudit, jsonError, requireHq } from '@/server/hims/http';
import { approveCommission, proposeCommission } from '@/server/hims/repository';

export const Route = createFileRoute('/api/hims/commission')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const desk = requireHq(request);
          const body = await request.json() as Record<string, unknown>;
          const actor = `hims:${desk}`;
          if (body.action === 'approve') {
            await approveCommission({ actor, desk, rateId: String(body.rateId ?? '') });
            await hqAudit(actor, desk, 'commission.approve', 'commission_rate', String(body.rateId ?? ''), null, {});
            return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
          }
          const result = await proposeCommission({
            actor,
            operatorId: String(body.operatorId ?? ''),
            mode: String(body.mode ?? ''),
            rate: Number(body.rate),
            effectiveFrom: String(body.effectiveFrom ?? ''),
            reason: String(body.reason ?? ''),
          });
          await hqAudit(actor, desk, 'commission.propose', 'commission_rate', result.id ?? null, String(body.mode ?? ''), body);
          return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

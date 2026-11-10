import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { hqAudit, jsonError } from '@/server/hims/http';
import { approveCommission, proposeCommission } from '@/server/hims/repository';

export const Route = createFileRoute('/api/hims/commission')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          if (body.action === 'approve') {
            const { desk, userId } = await requireHqPermission(request, 'hq.approvals.decide');
            const actor = `user:${userId}`;
            await approveCommission({ actor, desk, rateId: String(body.rateId ?? '') });
            await hqAudit(actor, desk, 'commission.approve', 'commission_rate', String(body.rateId ?? ''), null, {});
            return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
          }
          const { desk, userId } = await requireHqPermission(request, 'hq.finance.propose');
          const actor = `user:${userId}`;
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

import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { hqAudit, jsonError } from '@/server/hims/http';
import { approvePayout, createPayoutIntent, preparePayout } from '@/server/hims/repository';

export const Route = createFileRoute('/api/hims/payouts')({
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
            await approvePayout({ actor, desk, payoutId: String(body.payoutId ?? '') });
            await hqAudit(actor, desk, 'payout.approve', 'payout_batch', String(body.payoutId ?? ''), null, {});
            return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
          }
          if (body.action === 'intent') {
            const { desk, userId } = await requireHqPermission(request, 'hq.finance.settle');
            const actor = `user:${userId}`;
            const result = await createPayoutIntent({ actor, payoutId: String(body.payoutId ?? '') });
            await hqAudit(actor, desk, 'payout.intent', 'payout_batch', String(body.payoutId ?? ''), null, result);
            return Response.json(result, { headers: { 'cache-control': 'no-store' } });
          }
          const { desk, userId } = await requireHqPermission(request, 'hq.finance.propose');
          const actor = `user:${userId}`;
          const result = await preparePayout({
            actor,
            desk,
            mode: String(body.mode ?? ''),
            operatorId: String(body.operatorId ?? ''),
            currency: String(body.currency ?? ''),
          });
          await hqAudit(actor, desk, 'payout.prepare', 'payout_batch', result.id ?? null, String(body.mode ?? ''), result);
          return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

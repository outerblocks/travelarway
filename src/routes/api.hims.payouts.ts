import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { hqAudit, jsonError, requireHq } from '@/server/hims/http';
import { approvePayout, createPayoutIntent, preparePayout } from '@/server/hims/repository';

export const Route = createFileRoute('/api/hims/payouts')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const desk = requireHq(request);
          const actor = `hims:${desk}`;
          const body = await request.json() as Record<string, unknown>;
          if (body.action === 'approve') {
            await approvePayout({ actor, desk, payoutId: String(body.payoutId ?? '') });
            await hqAudit(actor, desk, 'payout.approve', 'payout_batch', String(body.payoutId ?? ''), null, {});
            return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
          }
          if (body.action === 'intent') {
            const result = await createPayoutIntent({ actor, payoutId: String(body.payoutId ?? '') });
            await hqAudit(actor, desk, 'payout.intent', 'payout_batch', String(body.payoutId ?? ''), null, result);
            return Response.json(result, { headers: { 'cache-control': 'no-store' } });
          }
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

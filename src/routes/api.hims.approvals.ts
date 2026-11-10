import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { hqAudit, jsonError } from '@/server/hims/http';
import { applyApprovalDecision, listApprovals } from '@/server/hims/work';

export const Route = createFileRoute('/api/hims/approvals')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.approvals.decide');
          const status = new URL(request.url).searchParams.get('status') ?? 'submitted';
          return Response.json(await listApprovals(status), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const { userId, desk } = await requireHqPermission(request, 'hq.approvals.decide');
          const body = await request.json() as Record<string, unknown>;
          const actor = `user:${userId}`;
          const result = await applyApprovalDecision({
            id: String(body.id ?? ''),
            checker: actor,
            decision: body.decision === 'rejected' || body.decision === 'withdrawn' ? body.decision : 'approved',
            reason: String(body.reason ?? ''),
          });
          await hqAudit(actor, desk, `approval.${result.decision}`, 'approval_item', String(body.id ?? ''), result.kind, {
            reason: String(body.reason ?? ''),
            kind: result.kind,
            objectId: result.objectId,
          });
          return Response.json(result, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

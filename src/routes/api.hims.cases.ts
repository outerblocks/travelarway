import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { hqAudit, jsonError } from '@/server/hims/http';
import { createCase, escalateCase, listCases, submitQuotedRefund } from '@/server/hims/work';

export const Route = createFileRoute('/api/hims/cases')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.cases.view');
          const kind = new URL(request.url).searchParams.get('kind') ?? undefined;
          return Response.json(await listCases(kind || undefined), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          if (body.action === 'escalate') {
            const { userId, desk } = await requireHqPermission(request, 'hq.cases.escalate');
            const actor = `user:${userId}`;
            const result = await escalateCase({
              caseId: String(body.caseId ?? ''),
              actor,
              severity: body.severity === 'p1' ? 'p1' : 'p2',
            });
            await hqAudit(actor, desk, 'case.escalate', 'work_case', String(body.caseId ?? ''), null, body);
            return Response.json(result, { headers: { 'cache-control': 'no-store' } });
          }
          if (body.action === 'refund') {
            const { userId, desk } = await requireHqPermission(request, 'hq.finance.view');
            await requireHqPermission(request, 'hq.cases.manage');
            const actor = `user:${userId}`;
            const result = await submitQuotedRefund({
              actorUserId: userId,
              actor,
              bookingId: String(body.bookingId ?? ''),
              reason: String(body.reason ?? ''),
            });
            await hqAudit(actor, desk, 'refund.request', 'booking', String(body.bookingId ?? ''), null, {
              reason: String(body.reason ?? ''),
              quotedMinor: result.quotedMinor,
            });
            return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
          }
          const { userId, desk } = await requireHqPermission(request, 'hq.cases.manage');
          const actor = `user:${userId}`;
          const priority = body.priority === 'p1' || body.priority === 'p2' || body.priority === 'p4' ? body.priority : 'p3';
          const result = await createCase({
            actorUserId: userId,
            actor,
            kind: String(body.kind ?? 'support'),
            priority,
            title: String(body.title ?? ''),
            bookingId: typeof body.bookingId === 'string' ? body.bookingId : null,
            operatorId: typeof body.operatorId === 'string' ? body.operatorId : null,
          });
          await hqAudit(actor, desk, 'case.open', 'work_case', result.id, null, body);
          return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

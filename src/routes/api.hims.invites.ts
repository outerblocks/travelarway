import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireHqPermission } from '@/server/identity/staff-gate';
import { hqAudit, jsonError } from '@/server/hims/http';
import { inviteHimsStaff, inviteOperatorAdmin, listInvites } from '@/server/identity/invites';

export const Route = createFileRoute('/api/hims/invites')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireHqPermission(request, 'hq.users.manage');
          return Response.json(await listInvites(), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          if (body.kind === 'hims') {
            const { userId, desk } = await requireHqPermission(request, 'hq.users.manage');
            const result = await inviteHimsStaff({
              actorUserId: userId,
              email: typeof body.email === 'string' ? body.email : '',
              displayName: typeof body.displayName === 'string' ? body.displayName : '',
              roleId: String(body.roleId ?? ''),
              departmentId: String(body.departmentId ?? ''),
              marketId: typeof body.marketId === 'string' ? body.marketId : undefined,
            });
            await hqAudit(`user:${userId}`, desk, 'staff.invite', 'staff_invite', result.inviteId, null, {
              email: result.email,
            });
            return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
          }
          const { userId, desk } = await requireHqPermission(request, 'hq.operators.invite');
          const result = await inviteOperatorAdmin({
            actorUserId: userId,
            email: typeof body.email === 'string' ? body.email : '',
            displayName: typeof body.displayName === 'string' ? body.displayName : '',
            operatorId: typeof body.operatorId === 'string' && body.operatorId ? body.operatorId : undefined,
            operatorName: typeof body.operatorName === 'string' ? body.operatorName : undefined,
            mode: typeof body.mode === 'string' ? body.mode : '',
            countryCode: typeof body.countryCode === 'string' ? body.countryCode : 'TZ',
            currency: typeof body.currency === 'string' ? body.currency : 'TZS',
          });
          await hqAudit(`user:${userId}`, desk, 'partner.invite', 'staff_invite', result.inviteId, result.operatorId, {
            email: result.email,
          });
          return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

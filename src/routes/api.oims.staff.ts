import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/oims/http';
import { inviteOperatorStaff } from '@/server/identity/invites';
import { query } from '@/server/db';

export const Route = createFileRoute('/api/oims/staff')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const { operatorId } = await requireOimsPermission(request, 'oims.users.manage');
          const roles = await query(
            `select id, code, name from app.role where code like 'oims_%' order by name`,
          );
          const invites = await query(
            `select i.id, i.email, i.expires_at as "expiresAt", i.accepted_at as "acceptedAt", i.revoked_at as "revokedAt"
               from app.staff_invite i
              where i.operator_id = $1
              order by i.created_at desc
              limit 50`,
            [operatorId],
          );
          return Response.json(
            { roles: roles.rows, invites: invites.rows, operatorId },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const { operatorId, userId, mode } = await requireOimsPermission(request, 'oims.users.manage');
          const body = await request.json() as Record<string, unknown>;
          const result = await inviteOperatorStaff({
            actorUserId: userId,
            operatorId,
            email: String(body.email ?? ''),
            displayName: String(body.displayName ?? ''),
            roleId: String(body.roleId ?? ''),
            mode,
          });
          return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

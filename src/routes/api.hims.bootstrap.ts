import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { query } from '@/server/db';
import { jsonError } from '@/server/hims/http';
import { requireAppSession } from '@/server/identity/staff-gate';

async function himsStaffCount(): Promise<number> {
  const found = await query<{ n: number }>(`select count(*)::int as n from app.staff_assignment where kind = 'hims' and status = 'active'`);
  return found.rows[0]?.n ?? 0;
}

export const Route = createFileRoute('/api/hims/bootstrap')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          await requireAppSession(request);
          return Response.json(
            { available: (await himsStaffCount()) === 0 },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          return jsonError(error);
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'hims');
        if (limited) return limited;
        try {
          const session = await requireAppSession(request);
          const count = await himsStaffCount();
          if (count > 0) {
            return Response.json({ error: 'hims_already_staffed' }, { status: 409, headers: { 'cache-control': 'no-store' } });
          }
          await query(
            `insert into app.staff_assignment (user_id, kind, hims_desk, status, role_id, department_id, market_id)
             values ($1, 'hims', 'admin', 'active',
               'c0000000-0000-4000-8000-000000000001',
               'b0000000-0000-4000-8000-000000000001',
               'a0000000-0000-4000-8000-000000000001')`,
            [session.userId],
          );
          return Response.json({ ok: true, desk: 'admin', role: 'hq_admin' }, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

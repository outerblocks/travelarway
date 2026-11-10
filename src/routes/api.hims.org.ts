import { createFileRoute } from '@tanstack/react-router';
import { requireHqPermission, requireHqStaff } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { listDecisions, listDepartments, listRoles } from '@/server/hims/org';

export const Route = createFileRoute('/api/hims/org')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const view = new URL(request.url).searchParams.get('view');
          if (view === 'roles') {
            await requireHqPermission(request, 'hq.roles.manage');
            return Response.json(await listRoles(), { headers: { 'cache-control': 'no-store' } });
          }
          if (view === 'departments') {
            await requireHqStaff(request);
            return Response.json(await listDepartments(), { headers: { 'cache-control': 'no-store' } });
          }
          await requireHqStaff(request);
          return Response.json(await listDecisions(), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

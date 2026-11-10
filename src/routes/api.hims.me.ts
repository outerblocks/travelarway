import { createFileRoute } from '@tanstack/react-router';
import { requireHqStaff } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/hims/http';
import { loadHqProfile } from '@/server/hims/org';

export const Route = createFileRoute('/api/hims/me')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const { userId, desk } = await requireHqStaff(request);
          const profile = await loadHqProfile(userId);
          if (!profile) {
            return Response.json({ error: 'forbidden' }, { status: 403, headers: { 'cache-control': 'no-store' } });
          }
          return Response.json({ ...profile, desk }, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

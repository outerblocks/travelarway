import { createFileRoute } from '@tanstack/react-router';
import { jsonError, requireHq } from '@/server/hims/http';
import { loadOverview } from '@/server/hims/repository';

export const Route = createFileRoute('/api/hims/overview')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          requireHq(request);
          return Response.json(await loadOverview(), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

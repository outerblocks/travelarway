import { createFileRoute } from '@tanstack/react-router';
import { jsonError, requireHq } from '@/server/hims/http';
import { loadOperators } from '@/server/hims/repository';

export const Route = createFileRoute('/api/hims/operators')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          requireHq(request);
          return Response.json(await loadOperators(), { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});

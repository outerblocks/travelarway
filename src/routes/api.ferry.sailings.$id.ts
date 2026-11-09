import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { findFerrySailing } from '@/server/ferry-results';

export const Route = createFileRoute('/api/ferry/sailings/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;
        try {
          const sailing = await findFerrySailing(params.id);
          if (!sailing) return Response.json({ error: 'sailing_not_found' }, { status: 404 });
          return Response.json(sailing, { headers: { 'cache-control': 'no-store' } });
        } catch {
          return Response.json({ error: 'sailing_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

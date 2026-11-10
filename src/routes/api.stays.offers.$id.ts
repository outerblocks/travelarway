import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { getStayOfferDetail } from '@/server/stays';

export const Route = createFileRoute('/api/stays/offers/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;
        try {
          const offer = await getStayOfferDetail(params.id);
          if (!offer) return Response.json({ error: 'offer_not_found' }, { status: 404 });
          return Response.json({ data: offer }, { headers: { 'cache-control': 'no-store' } });
        } catch {
          return Response.json({ error: 'stay_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

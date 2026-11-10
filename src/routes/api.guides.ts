import { createFileRoute } from '@tanstack/react-router';
import { isGuideLocale, listPublishedGuides } from '@/server/guides';
import { rateLimit } from '@/server/rate-limit';

export const Route = createFileRoute('/api/guides')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        const localeParam = new URL(request.url).searchParams.get('locale');
        const locale = isGuideLocale(localeParam) ? localeParam : 'en';

        try {
          const data = await listPublishedGuides(locale);
          return Response.json(
            { data, count: data.length },
            { headers: { 'cache-control': 'public, max-age=300' } },
          );
        } catch {
          return Response.json({ error: 'guides_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

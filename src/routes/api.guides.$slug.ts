import { createFileRoute } from '@tanstack/react-router';
import { getPublishedGuide, isGuideLocale } from '@/server/guides';
import { rateLimit } from '@/server/rate-limit';

export const Route = createFileRoute('/api/guides/$slug')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { slug: string } }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        const localeParam = new URL(request.url).searchParams.get('locale');
        const locale = isGuideLocale(localeParam) ? localeParam : 'en';

        try {
          const guide = await getPublishedGuide(params.slug, locale);
          if (!guide) return Response.json({ error: 'guide_not_found' }, { status: 404 });
          return Response.json(
            { data: guide },
            { headers: { 'cache-control': 'public, max-age=300' } },
          );
        } catch {
          return Response.json({ error: 'guides_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

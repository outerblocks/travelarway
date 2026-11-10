import { createFileRoute } from '@tanstack/react-router';
import { publicSiteOrigin, robotsTxt } from '@/domain/seo';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(robotsTxt(publicSiteOrigin()), {
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }),
    },
  },
});

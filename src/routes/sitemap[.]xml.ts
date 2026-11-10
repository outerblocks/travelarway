import { createFileRoute } from '@tanstack/react-router';
import { INDEXABLE_PATHS, publicSiteOrigin, sitemapXml } from '@/domain/seo';
import { listPublishedGuides } from '@/server/guides';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const guides = await listPublishedGuides('en').catch(() => []);
        const paths = [
          ...INDEXABLE_PATHS.map((loc) => ({ loc })),
          ...guides.map((guide) => ({ loc: `/guides/${guide.slug}`, lastmod: guide.researchedAt })),
        ];
        return new Response(sitemapXml(paths, publicSiteOrigin()), {
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=300',
          },
        });
      },
    },
  },
});

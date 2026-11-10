import { createFileRoute } from '@tanstack/react-router';
import { documentHead } from '@/domain/seo';
import { GuideArticlePage } from '@/pages/guides/GuideArticlePage';

export const Route = createFileRoute('/guides/$slug')({
  head: ({ params }) => {
    const built = documentHead(`/guides/${params.slug}`);
    return { meta: built.meta, links: built.links };
  },
  component: function GuideArticleRoute() {
    const { slug } = Route.useParams();
    return <GuideArticlePage slug={slug} />;
  },
});

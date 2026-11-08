import { createFileRoute } from '@tanstack/react-router';
import { GuideArticlePage } from '@/pages/guides/GuideArticlePage';

export const Route = createFileRoute('/guides/$slug')({
  component: function GuideArticleRoute() {
    const { slug } = Route.useParams();
    return <GuideArticlePage slug={slug} />;
  },
});

import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { StaysReviewPage } from '@/pages/stays/StaysReviewPage';

export const Route = createFileRoute('/stays/review')({
  ...routeSeo('/stays/review'),
  component: StaysReviewPage,
});

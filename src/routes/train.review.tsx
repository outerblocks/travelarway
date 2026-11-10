import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { TrainReviewPage } from '@/pages/train/TrainReviewPage';

export const Route = createFileRoute('/train/review')({
  ...routeSeo('/train/review'),
  component: TrainReviewPage,
});

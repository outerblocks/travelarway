import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { ExperiencesReviewPage } from '@/pages/experiences/ExperiencesReviewPage';

export const Route = createFileRoute('/experiences/review')({
  ...routeSeo('/experiences/review'),
  component: ExperiencesReviewPage,
});

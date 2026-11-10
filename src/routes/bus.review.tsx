import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { BusReviewPage } from '@/pages/bus/BusReviewPage';

export const Route = createFileRoute('/bus/review')({
  ...routeSeo('/bus/review'),
  component: BusReviewPage,
});

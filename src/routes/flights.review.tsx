import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { FlightReviewPage } from '@/pages/flights/FlightReviewPage';

export const Route = createFileRoute('/flights/review')({
  ...routeSeo('/flights/review'),
  component: FlightReviewPage,
});

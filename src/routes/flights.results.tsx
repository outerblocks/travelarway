import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { FlightResultsPage } from '@/pages/flights/FlightResultsPage';

export const Route = createFileRoute('/flights/results')({
  ...routeSeo('/flights/results'),
  component: FlightResultsPage,
});

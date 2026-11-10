import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { BusResultsPage } from '@/pages/bus/BusResultsPage';

export const Route = createFileRoute('/bus/results')({
  ...routeSeo('/bus/results'),
  component: BusResultsPage,
});

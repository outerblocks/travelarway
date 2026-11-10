import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { TrainResultsPage } from '@/pages/train/TrainResultsPage';

export const Route = createFileRoute('/train/results')({
  ...routeSeo('/train/results'),
  component: TrainResultsPage,
});

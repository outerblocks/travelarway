import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { FerryResultsPage } from '@/pages/ferry/FerryResultsPage';

export const Route = createFileRoute('/ferry/results')({
  ...routeSeo('/ferry/results'),
  component: FerryResultsPage,
});

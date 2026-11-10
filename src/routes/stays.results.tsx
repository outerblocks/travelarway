import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { StaysResultsPage } from '@/pages/stays/StaysResultsPage';

export const Route = createFileRoute('/stays/results')({
  ...routeSeo('/stays/results'),
  component: StaysResultsPage,
});

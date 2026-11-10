import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { ExperiencesResultsPage } from '@/pages/experiences/ExperiencesResultsPage';

export const Route = createFileRoute('/experiences/results')({
  ...routeSeo('/experiences/results'),
  component: ExperiencesResultsPage,
});

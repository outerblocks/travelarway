import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { ExperiencesDetailPage } from '@/pages/experiences/ExperiencesDetailPage';

export const Route = createFileRoute('/experiences/detail')({
  ...routeSeo('/experiences/detail'),
  component: ExperiencesDetailPage,
});

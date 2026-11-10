import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { OimsDashboardPage } from '@/pages/operator/OimsDashboardPage';

export const Route = createFileRoute('/operator/ferry')({
  ...routeSeo('/operator/ferry'),
  component: () => <OimsDashboardPage mode="ferry" />,
});

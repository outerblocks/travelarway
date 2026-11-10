import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { OimsDashboardPage } from '@/pages/operator/OimsDashboardPage';

export const Route = createFileRoute('/operator/bus')({
  ...routeSeo('/operator/bus'),
  component: () => <OimsDashboardPage mode="bus" />,
});

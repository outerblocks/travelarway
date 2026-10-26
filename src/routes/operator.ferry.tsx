import { createFileRoute } from '@tanstack/react-router';
import { OimsDashboardPage } from '@/pages/operator/OimsDashboardPage';

export const Route = createFileRoute('/operator/ferry')({
  component: () => <OimsDashboardPage mode="ferry" />,
});

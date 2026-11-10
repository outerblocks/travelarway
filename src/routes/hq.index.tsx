import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqDashboardPage } from '@/pages/hq/HqDashboardPage';

export const Route = createFileRoute('/hq/')({
  ...routeSeo('/hq/'),
  component: HqDashboardPage,
});

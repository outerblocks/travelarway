import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { DashboardPage } from '@/pages/account/DashboardPage';

export const Route = createFileRoute('/dashboard')({
  ...routeSeo('/dashboard'),
  component: DashboardPage,
});

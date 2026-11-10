import { createFileRoute, Outlet } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';

export const Route = createFileRoute('/hq/admin')({
  ...routeSeo('/hq/admin'),
  component: () => <Outlet />,
});

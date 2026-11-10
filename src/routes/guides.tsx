import { createFileRoute, Outlet } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';

export const Route = createFileRoute('/guides')({
  ...routeSeo('/guides'),
  component: function GuidesLayout() {
    return <Outlet />;
  },
});

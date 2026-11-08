import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/guides')({
  component: function GuidesLayout() {
    return <Outlet />;
  },
});

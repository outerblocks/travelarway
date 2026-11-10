import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqRolesPage } from '@/pages/hq/HqRolesPage';

export const Route = createFileRoute('/hq/admin/roles')({
  ...routeSeo('/hq/admin/roles'),
  component: HqRolesPage,
});

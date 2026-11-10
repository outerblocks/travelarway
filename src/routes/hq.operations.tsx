import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqOperationsPage } from '@/pages/hq/HqOperationsPage';

export const Route = createFileRoute('/hq/operations')({
  ...routeSeo('/hq/operations'),
  component: HqOperationsPage,
});

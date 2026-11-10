import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqSupplyPage } from '@/pages/hq/HqSupplyPage';

export const Route = createFileRoute('/hq/supply')({
  ...routeSeo('/hq/supply'),
  component: HqSupplyPage,
});

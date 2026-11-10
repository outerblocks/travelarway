import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { PartnersPage } from '@/pages/info/PartnersPage';

export const Route = createFileRoute('/partners')({
  ...routeSeo('/partners'),
  component: PartnersPage,
});

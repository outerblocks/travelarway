import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqCxPage } from '@/pages/hq/HqCxPage';

export const Route = createFileRoute('/hq/cx')({
  ...routeSeo('/hq/cx'),
  component: HqCxPage,
});

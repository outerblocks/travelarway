import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqWorkPage } from '@/pages/hq/HqWorkPage';

export const Route = createFileRoute('/hq/work')({
  ...routeSeo('/hq/work'),
  component: HqWorkPage,
});

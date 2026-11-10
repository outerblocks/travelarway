import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqFinancePage } from '@/pages/hq/HqFinancePage';

export const Route = createFileRoute('/hq/finance')({
  ...routeSeo('/hq/finance'),
  component: HqFinancePage,
});

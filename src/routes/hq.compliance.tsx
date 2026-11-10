import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqCompliancePage } from '@/pages/hq/HqCompliancePage';

export const Route = createFileRoute('/hq/compliance')({
  ...routeSeo('/hq/compliance'),
  component: HqCompliancePage,
});

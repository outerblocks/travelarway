import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { RefundsPage } from '@/pages/info/RefundsPage';

export const Route = createFileRoute('/refunds')({
  ...routeSeo('/refunds'),
  component: RefundsPage,
});

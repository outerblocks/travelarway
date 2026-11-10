import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { RefundsPage } from '@/pages/info/RefundsPage';

export const Route = createFileRoute('/cancellation-policy')({
  ...routeSeo('/cancellation-policy'),
  component: RefundsPage,
});

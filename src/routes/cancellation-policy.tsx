import { createFileRoute } from '@tanstack/react-router';
import { RefundsPage } from '@/pages/info/RefundsPage';

export const Route = createFileRoute('/cancellation-policy')({
  component: RefundsPage,
});

import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqQueuePage } from '@/pages/hq/HqQueuePage';

export const Route = createFileRoute('/hq/revenue')({
  ...routeSeo('/hq/revenue'),
  component: () => <HqQueuePage kind="revenue" title="Revenue" />,
});

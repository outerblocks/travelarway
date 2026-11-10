import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqQueuePage } from '@/pages/hq/HqQueuePage';

export const Route = createFileRoute('/hq/product')({
  ...routeSeo('/hq/product'),
  component: () => <HqQueuePage kind="product" title="Product" />,
});

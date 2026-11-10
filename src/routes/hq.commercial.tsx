import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqQueuePage } from '@/pages/hq/HqQueuePage';

export const Route = createFileRoute('/hq/commercial')({
  ...routeSeo('/hq/commercial'),
  component: () => <HqQueuePage kind="commercial" title="Commercial" />,
});

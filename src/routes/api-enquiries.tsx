import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/api-enquiries')({
  ...routeSeo('/api-enquiries'),
  component: () => <InfoPage title="API and Integration Enquiries" />,
});

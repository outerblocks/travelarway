import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/api-enquiries')({
  component: () => <InfoPage title="API and Integration Enquiries" />,
});

import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/cancellation-policy')({
  component: () => <InfoPage title="Cancellation and Refund Policy" />,
});

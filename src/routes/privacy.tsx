import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/privacy')({
  component: () => <InfoPage title="Privacy Policy" />,
});

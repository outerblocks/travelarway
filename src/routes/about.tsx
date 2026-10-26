import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/about')({
  component: () => <InfoPage title="About Travelar" />,
});

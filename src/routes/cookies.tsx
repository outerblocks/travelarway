import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/cookies')({
  component: () => <InfoPage title="Cookie Policy" />,
});

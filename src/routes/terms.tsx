import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/terms')({
  component: () => <InfoPage title="Terms and Conditions" />,
});

import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/contact')({
  component: () => <InfoPage title="Contact Us" />,
});

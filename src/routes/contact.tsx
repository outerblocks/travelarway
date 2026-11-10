import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/contact')({
  ...routeSeo('/contact'),
  component: () => <InfoPage title="Contact Us" />,
});

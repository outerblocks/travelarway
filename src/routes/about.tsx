import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { InfoPage } from '@/pages/info/InfoPage';

export const Route = createFileRoute('/about')({
  ...routeSeo('/about'),
  component: () => <InfoPage title="About Travelar" />,
});

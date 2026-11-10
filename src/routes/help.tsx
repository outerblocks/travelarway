import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HelpPage } from '@/pages/info/HelpPage';

export const Route = createFileRoute('/help')({
  ...routeSeo('/help'),
  component: HelpPage,
});

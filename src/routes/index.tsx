import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { LandingPage } from '@/pages/LandingPage';

export const Route = createFileRoute('/')({
  ...routeSeo('/'),
  component: LandingPage,
});

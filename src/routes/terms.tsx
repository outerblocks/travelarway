import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { TermsPage } from '@/pages/info/TermsPage';

export const Route = createFileRoute('/terms')({
  ...routeSeo('/terms'),
  component: TermsPage,
});

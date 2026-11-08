import { createFileRoute } from '@tanstack/react-router';
import { TermsPage } from '@/pages/info/TermsPage';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

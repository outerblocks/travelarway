import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { ConfirmationPage } from '@/pages/shared/ConfirmationPage';

export const Route = createFileRoute('/confirmation')({
  ...routeSeo('/confirmation'),
  component: ConfirmationPage,
});

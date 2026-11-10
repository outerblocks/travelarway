import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HimsSignInPage } from '@/pages/operator/HimsSignInPage';

export const Route = createFileRoute('/operator/hims-signin')({
  ...routeSeo('/operator/hims-signin'),
  component: HimsSignInPage,
});

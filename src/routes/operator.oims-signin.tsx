import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { OimsSignInPage } from '@/pages/operator/OimsSignInPage';

export const Route = createFileRoute('/operator/oims-signin')({
  ...routeSeo('/operator/oims-signin'),
  component: OimsSignInPage,
});

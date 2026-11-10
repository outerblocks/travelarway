import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { SignInPage } from '@/pages/account/SignInPage';

export const Route = createFileRoute('/signin')({
  ...routeSeo('/signin'),
  component: SignInPage,
});

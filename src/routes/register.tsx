import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { RegisterPage } from '@/pages/account/RegisterPage';

export const Route = createFileRoute('/register')({
  ...routeSeo('/register'),
  component: RegisterPage,
});

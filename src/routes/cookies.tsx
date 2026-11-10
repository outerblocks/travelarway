import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { CookiesPage } from '@/pages/info/CookiesPage';

export const Route = createFileRoute('/cookies')({
  ...routeSeo('/cookies'),
  component: CookiesPage,
});

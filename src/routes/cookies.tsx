import { createFileRoute } from '@tanstack/react-router';
import { CookiesPage } from '@/pages/info/CookiesPage';

export const Route = createFileRoute('/cookies')({
  component: CookiesPage,
});

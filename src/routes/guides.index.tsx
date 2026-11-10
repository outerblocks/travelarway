import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { GuidesIndexPage } from '@/pages/guides/GuidesIndexPage';

export const Route = createFileRoute('/guides/')({
  ...routeSeo('/guides'),
  component: GuidesIndexPage,
});

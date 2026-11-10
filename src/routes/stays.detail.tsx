import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { StaysDetailPage } from '@/pages/stays/StaysDetailPage';

export const Route = createFileRoute('/stays/detail')({
  ...routeSeo('/stays/detail'),
  component: StaysDetailPage,
});

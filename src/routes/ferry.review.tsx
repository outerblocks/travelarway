import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { FerryReviewPage } from '@/pages/ferry/FerryReviewPage';

export const Route = createFileRoute('/ferry/review')({
  ...routeSeo('/ferry/review'),
  component: FerryReviewPage,
});

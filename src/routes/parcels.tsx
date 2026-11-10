import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { ParcelTrackingPage } from '@/pages/shared/ParcelTrackingPage';

export const Route = createFileRoute('/parcels')({
  ...routeSeo('/parcels'),
  component: ParcelTrackingPage,
});

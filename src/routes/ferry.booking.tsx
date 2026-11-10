import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { FerryBookingPage } from '@/pages/ferry/FerryBookingPage';

export const Route = createFileRoute('/ferry/booking')({
  ...routeSeo('/ferry/booking'),
  component: FerryBookingPage,
});

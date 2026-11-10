import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { BusBookingPage } from '@/pages/bus/BusBookingPage';

export const Route = createFileRoute('/bus/booking')({
  ...routeSeo('/bus/booking'),
  component: BusBookingPage,
});

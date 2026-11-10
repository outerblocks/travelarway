import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { FlightBookingPage } from '@/pages/flights/FlightBookingPage';

export const Route = createFileRoute('/flights/booking')({
  ...routeSeo('/flights/booking'),
  component: FlightBookingPage,
});

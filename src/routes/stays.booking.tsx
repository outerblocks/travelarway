import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { StaysBookingPage } from '@/pages/stays/StaysBookingPage';

export const Route = createFileRoute('/stays/booking')({
  ...routeSeo('/stays/booking'),
  component: StaysBookingPage,
});

import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { TrainBookingPage } from '@/pages/train/TrainBookingPage';

export const Route = createFileRoute('/train/booking')({
  ...routeSeo('/train/booking'),
  component: TrainBookingPage,
});

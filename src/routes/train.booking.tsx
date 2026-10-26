import { createFileRoute } from '@tanstack/react-router';
import { TrainBookingPage } from '@/pages/train/TrainBookingPage';

export const Route = createFileRoute('/train/booking')({ component: TrainBookingPage });

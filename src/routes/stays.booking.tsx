import { createFileRoute } from '@tanstack/react-router';
import { StaysBookingPage } from '@/pages/stays/StaysBookingPage';

export const Route = createFileRoute('/stays/booking')({ component: StaysBookingPage });

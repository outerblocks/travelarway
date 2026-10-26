import { createFileRoute } from '@tanstack/react-router';
import { BusBookingPage } from '@/pages/bus/BusBookingPage';

export const Route = createFileRoute('/bus/booking')({ component: BusBookingPage });

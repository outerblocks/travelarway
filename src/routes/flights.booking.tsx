import { createFileRoute } from '@tanstack/react-router';
import { FlightBookingPage } from '@/pages/flights/FlightBookingPage';

export const Route = createFileRoute('/flights/booking')({ component: FlightBookingPage });

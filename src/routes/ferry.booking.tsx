import { createFileRoute } from '@tanstack/react-router';
import { FerryBookingPage } from '@/pages/ferry/FerryBookingPage';

export const Route = createFileRoute('/ferry/booking')({ component: FerryBookingPage });

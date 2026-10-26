import { createFileRoute } from '@tanstack/react-router';
import { ManageBookingPage } from '@/pages/account/ManageBookingPage';

export const Route = createFileRoute('/manage-booking')({ component: ManageBookingPage });

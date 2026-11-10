import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { ManageBookingPage } from '@/pages/account/ManageBookingPage';

export const Route = createFileRoute('/manage-booking')({
  ...routeSeo('/manage-booking'),
  component: ManageBookingPage,
});

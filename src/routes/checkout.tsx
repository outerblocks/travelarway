import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { CheckoutPage } from '@/pages/shared/CheckoutPage';

export const Route = createFileRoute('/checkout')({
  ...routeSeo('/checkout'),
  component: CheckoutPage,
});

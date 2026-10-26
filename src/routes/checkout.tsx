import { createFileRoute } from '@tanstack/react-router';
import { CheckoutPage } from '@/pages/shared/CheckoutPage';

export const Route = createFileRoute('/checkout')({ component: CheckoutPage });

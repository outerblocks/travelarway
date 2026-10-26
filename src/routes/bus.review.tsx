import { createFileRoute } from '@tanstack/react-router';
import { BusReviewPage } from '@/pages/bus/BusReviewPage';

export const Route = createFileRoute('/bus/review')({ component: BusReviewPage });

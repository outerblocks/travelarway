import { createFileRoute } from '@tanstack/react-router';
import { FlightReviewPage } from '@/pages/flights/FlightReviewPage';

export const Route = createFileRoute('/flights/review')({ component: FlightReviewPage });

import { createFileRoute } from '@tanstack/react-router';
import { StaysReviewPage } from '@/pages/stays/StaysReviewPage';

export const Route = createFileRoute('/stays/review')({ component: StaysReviewPage });

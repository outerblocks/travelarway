import { createFileRoute } from '@tanstack/react-router';
import { TrainReviewPage } from '@/pages/train/TrainReviewPage';

export const Route = createFileRoute('/train/review')({ component: TrainReviewPage });

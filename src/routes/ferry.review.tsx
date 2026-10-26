import { createFileRoute } from '@tanstack/react-router';
import { FerryReviewPage } from '@/pages/ferry/FerryReviewPage';

export const Route = createFileRoute('/ferry/review')({ component: FerryReviewPage });

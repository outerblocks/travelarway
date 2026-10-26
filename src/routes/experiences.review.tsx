import { createFileRoute } from '@tanstack/react-router';
import { ExperiencesReviewPage } from '@/pages/experiences/ExperiencesReviewPage';

export const Route = createFileRoute('/experiences/review')({ component: ExperiencesReviewPage });

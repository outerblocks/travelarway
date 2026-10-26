import { createFileRoute } from '@tanstack/react-router';
import { ExperiencesResultsPage } from '@/pages/experiences/ExperiencesResultsPage';

export const Route = createFileRoute('/experiences/results')({ component: ExperiencesResultsPage });

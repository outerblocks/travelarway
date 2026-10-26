import { createFileRoute } from '@tanstack/react-router';
import { ExperiencesDetailPage } from '@/pages/experiences/ExperiencesDetailPage';

export const Route = createFileRoute('/experiences/detail')({ component: ExperiencesDetailPage });

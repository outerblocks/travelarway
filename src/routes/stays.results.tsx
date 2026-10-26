import { createFileRoute } from '@tanstack/react-router';
import { StaysResultsPage } from '@/pages/stays/StaysResultsPage';

export const Route = createFileRoute('/stays/results')({ component: StaysResultsPage });

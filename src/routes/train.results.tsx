import { createFileRoute } from '@tanstack/react-router';
import { TrainResultsPage } from '@/pages/train/TrainResultsPage';

export const Route = createFileRoute('/train/results')({ component: TrainResultsPage });

import { createFileRoute } from '@tanstack/react-router';
import { FerryResultsPage } from '@/pages/ferry/FerryResultsPage';

export const Route = createFileRoute('/ferry/results')({ component: FerryResultsPage });

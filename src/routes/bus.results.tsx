import { createFileRoute } from '@tanstack/react-router';
import { BusResultsPage } from '@/pages/bus/BusResultsPage';

export const Route = createFileRoute('/bus/results')({ component: BusResultsPage });

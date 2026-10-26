import { createFileRoute } from '@tanstack/react-router';
import { FlightResultsPage } from '@/pages/flights/FlightResultsPage';

export const Route = createFileRoute('/flights/results')({ component: FlightResultsPage });
